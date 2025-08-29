"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { PrintTemplate } from "@/lib/types/database"
import { getInvoiceSettings } from "@/lib/actions/settings"
import {
  getAllPrintTemplates,
  createPrintTemplate,
  updatePrintTemplate,
  deletePrintTemplate,
} from "@/lib/actions/print-templates"
import {
  Loader2,
  Eye,
  Code,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Save,
  Printer,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { processPrintTemplateContent } from "@/lib/utils"
import { SimplePlaceholderSelector } from "@/components/simple-placeholder-selector"

interface BusinessSettings {
  businessName?: string
  businessAddress?: string
  businessPhone?: string
  businessEmail?: string
  businessWebsite?: string
  businessLogo?: string
  taxNumber?: string
  [key: string]: unknown
}

export default function InvoicePrintSettingsPage() {
  // Print Templates States
  const [printTemplates, setPrintTemplates] = useState<PrintTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null)
  const [htmlContent, setHtmlContent] = useState<string>("")
  const [templateName, setTemplateName] = useState<string>("")
  const [templateType, setTemplateType] = useState<"receipt" | "pre_receipt">("receipt")
  const [isDefault, setIsDefault] = useState<boolean>(false)
  const [selectedBranch] = useState<string>("default-branch")
  const [selectedPaperSize] = useState<string>("k80")
  const [isDefaultSize] = useState<boolean>(true)

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)

  // Loading States
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})

  // Dialog States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [selectedFontSize, setSelectedFontSize] = useState("14")
  const [selectedFontFamily, setSelectedFontFamily] = useState("Arial")
  const editorRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const [, fetchedTemplates] = await Promise.all([getInvoiceSettings(), getAllPrintTemplates()])

    try {
      const response = await fetch("/api/settings/business")
      if (response.ok) {
        const settings = await response.json()
        setBusinessSettings(settings)
      }
    } catch (error) {
      console.error("Failed to fetch business settings:", error)
    }

    setPrintTemplates(fetchedTemplates)

    // Set default selected template if available
    if (fetchedTemplates.length > 0) {
      const defaultReceiptTemplate = fetchedTemplates.find(
        (template) => template.type === "receipt" && template.is_default,
      )
      const templateToSelect = defaultReceiptTemplate || fetchedTemplates[0]
      setSelectedTemplateId(String(templateToSelect.id))
      setSelectedTemplate(templateToSelect)
      setHtmlContent(templateToSelect.content)
      setTemplateName(templateToSelect.name)
      setTemplateType(templateToSelect.type)
      setIsDefault(templateToSelect.is_default)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      // Only set innerHTML if content is different to avoid cursor jumping
      if (editorRef.current.innerHTML !== htmlContent) {
        const selection = window.getSelection()
        let cursorPosition = 0

        // Save cursor position if there's a selection
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          cursorPosition = range.startOffset
        }

        editorRef.current.innerHTML = htmlContent

        // Restore cursor position
        if (selection && editorRef.current.firstChild) {
          try {
            const range = document.createRange()
            const textNode = editorRef.current.firstChild
            range.setStart(textNode, Math.min(cursorPosition, textNode.textContent?.length || 0))
            range.setEnd(textNode, Math.min(cursorPosition, textNode.textContent?.length || 0))
            selection.removeAllRanges()
            selection.addRange(range)
          } catch {
            // Ignore cursor restoration errors
          }
        }
      }
    }
  }, [selectedTemplate, isHtmlMode, htmlContent])

  const handleTemplateSelect = (templateId: string) => {
    const template = printTemplates.find((t) => String(t.id) === templateId)
    if (template) {
      setSelectedTemplateId(templateId)
      setSelectedTemplate(template)
      setHtmlContent(template.content)
      setTemplateName(template.name)
      setTemplateType(template.type)
      setIsDefault(template.is_default)
    }
  }

  const handleNewTemplate = () => {
    setSelectedTemplateId(null)
    setSelectedTemplate(null)
    setHtmlContent(`<div class="text-center">
  <h2 class="font-bold text-lg">{{businessName}}</h2>
  <p class="text-xs">{{businessAddress}}</p>
  <p class="text-xs">ĐT: {{businessPhone}}</p>
  <hr class="my-2">
  <h3 class="font-bold">HÓA ĐƠN BÁN HÀNG</h3>
  <p class="text-xs">Số: {{invoiceNumber}}</p>
  <p class="text-xs">Ngày: {{invoiceDate}}</p>
  <hr class="my-2">
</div>

<div class="space-y-1">
  {{#each items}}
  <div class="flex justify-between text-xs">
    <span>{{description}}</span>
    <span>{{formatPrice total}}</span>
  </div>
  {{/each}}
</div>

<hr class="my-2">
<div class="flex justify-between font-bold">
  <span>TỔNG CỘNG:</span>
  <span>{{formatPrice totalAmount}}</span>
</div>

<div class="text-center text-xs mt-4">
  <p>Cảm ơn quý khách!</p>
</div>`)
    setTemplateName("Mẫu mới")
    setTemplateType("receipt")
    setIsDefault(false)
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !htmlContent.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên mẫu và nội dung HTML không được để trống.",
        variant: "destructive",
      })
      return
    }

    setIsSavingTemplate(true)
    try {
      if (selectedTemplate) {
        const result = await updatePrintTemplate(
          String(selectedTemplate.id),
          templateName,
          htmlContent,
          templateType,
          isDefault,
        )
        if (result.success) {
          toast({
            title: "Thành công",
            description: "Mẫu in đã được cập nhật.",
          })
        } else {
          toast({
            title: "Lỗi",
            description: result.error || "Không thể cập nhật mẫu in.",
            variant: "destructive",
          })
        }
      } else {
        const result = await createPrintTemplate(
          templateName,
          htmlContent,
          templateType,
          isDefault,
        )
        if (result.success) {
          toast({
            title: "Thành công",
            description: "Mẫu in mới đã được thêm.",
          })
        } else {
          toast({
            title: "Lỗi",
            description: result.error || "Không thể thêm mẫu in mới.",
            variant: "destructive",
          })
        }
      }

      // Refresh templates
      const fetchedTemplates = await getAllPrintTemplates()
      setPrintTemplates(fetchedTemplates)
    } finally {
      setIsSavingTemplate(false)
    }
  }

  const handlePreviewTemplate = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const testContent = processPrintTemplateContent(htmlContent, businessSettings || undefined)
      printWindow.document.write(`
        <html>
        <head>
          <title>Xem trước mẫu in</title>
          <style>
            body { font-family: sans-serif; margin: 0; padding: 20px; }
            .receipt-container { width: 300px; margin: 0 auto; border: 1px solid #eee; padding: 15px; }
            hr { border: none; border-top: 1px dashed #ccc; margin: 15px 0; }
            h2, h3, h4 { margin: 0; }
            p { margin: 0; }
            .text-center { text-align: center; }
            .flex-between { display: flex; justify-content: space-between; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 1.125em; }
            .text-xs { font-size: 0.75em; }
            .text-muted-foreground { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${testContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const executeDeleteTemplate = async () => {
    if (!templateToDelete) return

    setIsDeleting((prev) => ({ ...prev, [templateToDelete]: true }))
    try {
      const result = await deletePrintTemplate(templateToDelete)
      if (result.success) {
        toast({
          title: "Thành công",
          description: "Mẫu in đã được xóa.",
        })

        // Refresh templates and reset form if deleted template was selected
        const fetchedTemplates = await getAllPrintTemplates()
        setPrintTemplates(fetchedTemplates)

        if (selectedTemplateId === templateToDelete) {
          if (fetchedTemplates.length > 0) {
            const newTemplate = fetchedTemplates[0]
            handleTemplateSelect(String(newTemplate.id))
          } else {
            handleNewTemplate()
          }
        }
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể xóa mẫu in.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting((prev) => ({ ...prev, [templateToDelete || ""]: false }))
      setIsDeleteDialogOpen(false)
      setTemplateToDelete(null)
    }
  }

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    // Use setTimeout to ensure DOM is updated before getting content
    setTimeout(() => {
      if (editorRef.current) {
        const content = editorRef.current.innerHTML
        setHtmlContent(content)
      }
    }, 0)
  }, [])

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      // Only update if content actually changed
      if (content !== htmlContent) {
        setHtmlContent(content)
      }
    }
  }, [htmlContent])

  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Switching from HTML to WYSIWYG
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlContent
      }
    } else {
      // Switching from WYSIWYG to HTML
      if (editorRef.current) {
        setHtmlContent(editorRef.current.innerHTML)
      }
    }
    setIsHtmlMode(!isHtmlMode)
  }

  const insertPlaceholderInEditor = (placeholder: string) => {
    if (isHtmlMode) {
      // Insert in textarea
      const textarea = document.getElementById("html-content") as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newContent = htmlContent.substring(0, start) + placeholder + htmlContent.substring(end)
        setHtmlContent(newContent)
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + placeholder.length, start + placeholder.length)
        }, 0)
      }
    } else {
      // Insert in rich text editor
      if (editorRef.current) {
        editorRef.current.focus()
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const placeholderSpan = document.createElement("span")
          placeholderSpan.className = "bg-yellow-100 px-1 rounded text-blue-600 font-mono text-sm"
          placeholderSpan.textContent = placeholder
          range.deleteContents()
          range.insertNode(placeholderSpan)
          range.setStartAfter(placeholderSpan)
          range.setEndAfter(placeholderSpan)
          selection.removeAllRanges()
          selection.addRange(range)
        } else {
          const placeholderSpan = document.createElement("span")
          placeholderSpan.className = "bg-yellow-100 px-1 rounded text-blue-600 font-mono text-sm"
          placeholderSpan.textContent = placeholder
          editorRef.current.appendChild(placeholderSpan)
        }
        handleEditorInput()
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2 text-gray-600">Đang tải cài đặt...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-2xl font-bold">Cài đặt hóa đơn & mẫu in</h1>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full flex flex-col space-y-4">
          <div className="bg-gray-50 border rounded-lg p-4 mb-4">
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-3">
                <Label className="text-xs text-gray-600 mb-1 block">Chọn mẫu in</Label>
                <Select
                  value={selectedTemplateId ?? "new"}
                  onValueChange={(value) => (value === "new" ? handleNewTemplate() : handleTemplateSelect(value))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Đơn bán hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Tạo mẫu mới</SelectItem>
                    {printTemplates.map((template) => (
                      <SelectItem key={template.id} value={String(template.id)}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="template-name" className="text-xs text-gray-600 mb-1 block">
                  Tên mẫu
                </Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Nhập tên mẫu"
                  className="h-8 text-sm"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="template-type" className="text-xs text-gray-600 mb-1 block">
                  Loại mẫu
                </Label>
                <Select
                  value={templateType}
                  onValueChange={(value: "receipt" | "pre_receipt") => setTemplateType(value)}
                >
                  <SelectTrigger id="template-type" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt">Hóa đơn</SelectItem>
                    <SelectItem value="pre_receipt">Tạm tính</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Switch id="is-default" checked={isDefault} onCheckedChange={setIsDefault} />
                <Label htmlFor="is-default" className="text-xs text-gray-600">
                  Mặc định
                </Label>
              </div>

              <div className="col-span-3 flex items-center justify-end space-x-2">
                <Button onClick={handleSaveTemplate} disabled={isSavingTemplate} size="sm" className="h-8">
                  {isSavingTemplate ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1 h-3 w-3" />
                      Lưu
                    </>
                  )}
                </Button>
                <Button onClick={handlePreviewTemplate} variant="outline" size="sm" className="h-8 bg-transparent">
                  <Eye className="mr-1 h-3 w-3" />
                  Xem trước
                </Button>
                <Button onClick={handlePreviewTemplate} variant="outline" size="sm" className="h-8 bg-transparent">
                  <Printer className="mr-1 h-3 w-3" />
                  In thử
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Left Column: Content Editor */}
            <Card className="flex flex-col min-h-0">
              <CardHeader className="pb-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Nội dung mẫu in</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 p-3">
                {/* Rich Text Editor Toolbar */}
                <div className="border border-gray-300 rounded-t-md bg-gray-50 p-1 flex-shrink-0">
                  <div className="flex flex-wrap items-center gap-1">
                    {!isHtmlMode && (
                      <>
                        {/* Font Family */}
                        <Select value={selectedFontFamily} onValueChange={setSelectedFontFamily}>
                          <SelectTrigger className="w-28 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                            <SelectItem value="Tahoma">Tahoma</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Font Size */}
                        <Select value={selectedFontSize} onValueChange={setSelectedFontSize}>
                          <SelectTrigger className="w-14 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="12">12</SelectItem>
                            <SelectItem value="14">14</SelectItem>
                            <SelectItem value="16">16</SelectItem>
                            <SelectItem value="18">18</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="24">24</SelectItem>
                          </SelectContent>
                        </Select>

                        <Separator orientation="vertical" className="h-5" />

                        {/* Text Formatting */}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => execCommand("bold")}>
                          <Bold className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => execCommand("italic")}>
                          <Italic className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => execCommand("underline")}
                        >
                          <Underline className="h-3 w-3" />
                        </Button>

                        <Separator orientation="vertical" className="h-5" />

                        {/* Alignment */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => execCommand("justifyLeft")}
                        >
                          <AlignLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => execCommand("justifyCenter")}
                        >
                          <AlignCenter className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => execCommand("justifyRight")}
                        >
                          <AlignRight className="h-3 w-3" />
                        </Button>

                        <Separator orientation="vertical" className="h-5" />

                        {/* Lists */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => execCommand("insertUnorderedList")}
                        >
                          <List className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => execCommand("insertOrderedList")}
                        >
                          <ListOrdered className="h-3 w-3" />
                        </Button>

                        <Separator orientation="vertical" className="h-5" />

                        {/* Placeholder Button */}
                        <SimplePlaceholderSelector
                          onInsert={(placeholder) => {
                            insertPlaceholderInEditor(placeholder)
                          }}
                        />

                        <Separator orientation="vertical" className="h-5" />
                      </>
                    )}

                    {/* HTML Toggle Button - always visible */}
                    <Button
                      variant={isHtmlMode ? "default" : "ghost"}
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={toggleHtmlMode}
                    >
                      <Code className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {!isHtmlMode && (
                  <>
                    {/* Rich Text Editor Content */}
                    <div
                      ref={editorRef}
                      contentEditable
                      className="flex-1 p-2 border border-t-0 border-gray-300 rounded-b-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white overflow-y-auto min-h-0"
                      style={{
                        fontFamily: selectedFontFamily,
                        fontSize: `${selectedFontSize}px`,
                        lineHeight: "1.4",
                      }}
                      onInput={handleEditorInput}
                      suppressContentEditableWarning={true}
                    />
                  </>
                )}

                {isHtmlMode && (
                  <Textarea
                    id="html-content"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="Nhập nội dung HTML cho mẫu in..."
                    className="flex-1 font-mono text-sm border border-t-0 border-gray-300 rounded-b-md"
                  />
                )}

                <p className="text-xs text-gray-600 mt-2">
                  {isHtmlMode
                    ? "Chế độ HTML: Chỉnh sửa trực tiếp mã HTML của mẫu in."
                    : "Chế độ thiết kế: Sử dụng toolbar để định dạng văn bản như Microsoft Word."}
                </p>
              </CardContent>
            </Card>

            {/* Right Column: Preview */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h3 className="text-sm font-semibold">Bản xem trước</h3>
              </div>

              {/* Live Preview */}
              <Card className="flex-1 flex flex-col min-h-0">
                <CardContent className="flex-1 flex flex-col min-h-0 p-3">
                  <div
                    className="border rounded-md p-2 bg-white flex-1 overflow-y-auto min-h-0"
                    style={{ fontSize: "10px", fontFamily: "Arial, sans-serif" }}
                    dangerouslySetInnerHTML={{
                      __html: processPrintTemplateContent(htmlContent, businessSettings || undefined),
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa mẫu in này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn mẫu in đã chọn khỏi cơ sở dữ liệu của bạn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting[templateToDelete || ""]}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteTemplate} disabled={isDeleting[templateToDelete || ""]}>
              {isDeleting[templateToDelete || ""] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
