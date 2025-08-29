"use client"

import type React from "react"
import { useState, useRef, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import {
  uploadAndParseExcel,
  processAndImportProducts,
  downloadProductTemplateAction,
  type ParsedProductRow,
  type ImportValidationError,
  type FileDownloadResult, // Import the new type
} from "@/actions/product-import"
import type { Product } from "@/lib/types/database"

type ImportStep = "upload" | "mapping" | "validation" | "importing" | "completed" | "error"

const PRODUCT_DB_FIELDS: { label: string; value: keyof Product }[] = [
  { label: "Tên sản phẩm (name)", value: "name" },
  { label: "Mô tả (description)", value: "description" },
  { label: "Giá bán lẻ (retail_price)", value: "retail_price" },
  { label: "Giá bán buôn (wholesale_price)", value: "wholesale_price" },
  { label: "Giá vốn (cost_price)", value: "cost_price" },
  { label: "Số lượng tồn kho (stock_quantity)", value: "stock_quantity" },
  { label: "Mức tồn kho tối thiểu (min_stock_level)", value: "min_stock_level" },
  { label: "Mã vạch (barcode)", value: "barcode" },
  { label: "SKU (sku)", value: "sku" },
  { label: "URL hình ảnh (image_url)", value: "image_url" },
  { label: "Trạng thái (status)", value: "status" },
  { label: "ID danh mục (category_id)", value: "category_id" },
]

export function ProductImportForm() {
  const { toast } = useToast()
  const [step, setStep] = useState<ImportStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [parsedData, setParsedData] = useState<ParsedProductRow[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, keyof Product>>({})
  const [validationErrors, setValidationErrors] = useState<ImportValidationError[]>([])
  const [isPendingUpload, startUploadTransition] = useTransition()
  const [isPendingImport, startImportTransition] = useTransition()
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Initialize default mapping if headers are available
    if (excelHeaders.length > 0) {
      const defaultMap: Record<string, keyof Product> = {}
      excelHeaders.forEach((header) => {
        const found = PRODUCT_DB_FIELDS.find((field) => field.label.toLowerCase().includes(header.toLowerCase()))
        if (found) {
          defaultMap[header] = found.value
        }
      })
      setColumnMapping(defaultMap)
    }
  }, [excelHeaders])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
      setStep("upload")
      setMessage(null)
      setExcelHeaders([])
      setParsedData([])
      setColumnMapping({})
      setValidationErrors([])
      setProgress(0)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn một file Excel để tải lên.",
        variant: "destructive",
      })
      return
    }

    setMessage("Đang tải lên và phân tích file...")
    setProgress(10)
    setStep("upload")

    const formData = new FormData()
    formData.append("file", file)

    startUploadTransition(async () => {
      const result = await uploadAndParseExcel(formData)
      setProgress(50)

      if (result.success && result.data && result.headers) {
        setExcelHeaders(result.headers)
        setParsedData(result.data)
        setMessage(result.message)
        setStep("mapping")
        setProgress(100)
        toast({
          title: "Thành công",
          description: result.message,
          variant: "default",
        })
      } else {
        setMessage(result.message)
        setStep("error")
        setProgress(0)
        toast({
          title: "Lỗi tải lên",
          description: result.message,
          variant: "destructive",
        })
      }
    })
  }

  const handleColumnMappingChange = (excelCol: string, dbField: string) => {
    setColumnMapping((prev) => ({ ...prev, [excelCol]: dbField as keyof Product }))
  }

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "Lỗi",
        description: "Không có dữ liệu để nhập. Vui lòng tải lên file Excel trước.",
        variant: "destructive",
      })
      return
    }

    setMessage("Đang xử lý và nhập dữ liệu...")
    setProgress(10)
    setStep("importing")

    startImportTransition(async () => {
      const result = await processAndImportProducts(parsedData, columnMapping)
      setProgress(70)

      if (result.success) {
        setMessage(result.message)
        setStep("completed")
        setProgress(100)
        toast({
          title: "Thành công",
          description: result.message,
          variant: "default",
        })
      } else {
        setMessage(result.message)
        setValidationErrors(result.errors || [])
        setStep("validation") // Go to validation step if errors
        setProgress(0)
        toast({
          title: "Lỗi nhập liệu",
          description: result.message,
          variant: "destructive",
        })
      }
    })
  }

  const handleDownloadTemplate = async () => {
    try {
      const result: FileDownloadResult = await downloadProductTemplateAction() // Expect a plain object
      if (result.success && result.fileData && result.fileName) {
        const byteCharacters = atob(result.fileData)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = result.fileName
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        toast({
          title: "Thành công",
          description: result.message,
          variant: "default",
        })
      } else {
        toast({
          title: "Lỗi",
          description: result.message || "Không thể tải xuống template.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error downloading template:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải xuống template.",
        variant: "destructive",
      })
    }
  }

  const handleCorrectData = (rowIndex: number, column: string, newValue: string | number) => {
    setParsedData((prevData) => {
      const newData = [...prevData]
      const rowToUpdate = newData.find((row) => row.originalRowIndex === rowIndex)
      if (rowToUpdate) {
        rowToUpdate[column] = newValue
      }
      return newData
    })
    // Clear the specific error after correction
    setValidationErrors((prevErrors) =>
      prevErrors.filter((error) => !(error.rowIndex === rowIndex && error.column === column)),
    )
  }

  const hasUnresolvedErrors = validationErrors.length > 0

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={step === "error" ? "border-red-500" : ""}>
          {step === "error" ? <XCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{step === "error" ? "Lỗi!" : "Thông báo"}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {(isPendingUpload || isPendingImport) && (
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <Progress value={progress} className="w-full" />
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
      )}

      {step === "upload" && (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
          <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
          <div className="flex flex-col items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPendingUpload}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {file ? file.name : "Chọn file Excel"}
            </Button>
            {file && (
              <Button onClick={handleUpload} disabled={isPendingUpload}>
                {isPendingUpload ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải lên...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Tải lên và phân tích
                  </>
                )}
              </Button>
            )}
            <p className="text-sm text-gray-500">Hỗ trợ định dạng .xlsx. Kích thước tối đa 5MB.</p>
            <Button variant="link" onClick={handleDownloadTemplate} className="flex items-center gap-1">
              <Download className="h-4 w-4" /> Tải xuống template Excel
            </Button>
          </div>
        </div>
      )}

      {step === "mapping" && excelHeaders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Ánh xạ cột Excel với trường sản phẩm</h3>
          <p className="text-sm text-muted-foreground">
            Vui lòng chọn trường sản phẩm tương ứng cho mỗi cột trong file Excel của bạn.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {excelHeaders.map((header) => (
              <div key={header} className="flex items-center gap-2">
                <Label className="w-1/2">{header}</Label>
                <Select
                  value={columnMapping[header] || "none"} // Updated default value to 'none'
                  onValueChange={(value) => handleColumnMappingChange(header, value)}
                >
                  <SelectTrigger className="w-1/2">
                    <SelectValue placeholder="Chọn trường sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_DB_FIELDS.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="none">Không ánh xạ</SelectItem>{" "}
                    {/* Fixed JSX comment syntax and escaped apostrophe */}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <Button onClick={handleImport} disabled={isPendingImport}>
            {isPendingImport ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang nhập dữ liệu...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" /> Bắt đầu nhập dữ liệu
              </>
            )}
          </Button>
        </div>
      )}

      {step === "validation" && validationErrors.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-600">Lỗi xác thực dữ liệu</h3>
          <p className="text-sm text-muted-foreground">
            Vui lòng kiểm tra và chỉnh sửa các lỗi dưới đây. Bạn có thể chỉnh sửa trực tiếp trong bảng.
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dòng</TableHead>
                  <TableHead>Cột Excel</TableHead>
                  <TableHead>Giá trị</TableHead>
                  <TableHead>Lỗi</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationErrors.map((error, index) => (
                  <TableRow key={index} className="bg-red-50/50">
                    <TableCell>{error.rowIndex}</TableCell>
                    <TableCell>{error.column}</TableCell>
                    <TableCell>
                      <Input
                        value={parsedData.find((row) => row.originalRowIndex === error.rowIndex)?.[error.column] || ""}
                        onChange={(e) => handleCorrectData(error.rowIndex, error.column, e.target.value)}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell className="text-red-600">{error.message}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setValidationErrors((prev) => prev.filter((_, i) => i !== index))}
                      >
                        Bỏ qua
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button onClick={handleImport} disabled={isPendingImport || hasUnresolvedErrors}>
            {isPendingImport ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang nhập lại...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" /> Nhập lại sau khi sửa lỗi
              </>
            )}
          </Button>
          {hasUnresolvedErrors && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Vẫn còn lỗi chưa được giải quyết. Vui lòng sửa hoặc bỏ qua tất cả các lỗi.
            </p>
          )}
        </div>
      )}

      {step === "completed" && (
        <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-lg text-green-700">
          <CheckCircle className="h-12 w-12 mb-4" />
          <h3 className="text-xl font-semibold">Nhập dữ liệu thành công!</h3>
          <p className="text-center">{message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Nhập file khác
          </Button>
        </div>
      )}
    </div>
  )
}
