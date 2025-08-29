"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Printer, Loader2 } from "lucide-react" // Import Loader2 icon
import type { PrintTemplate } from "@/lib/types/database"
import { processPrintTemplateContent } from "@/lib/utils" // Import the new utility function

// Import AceEditor and necessary modes/themes
import AceEditor from "react-ace"
import "ace-builds/src-noconflict/mode-html"
import "ace-builds/src-noconflict/theme-github" // You can choose other themes like 'monokai', 'dracula', etc.
import "ace-builds/src-noconflict/ext-language_tools" // For autocompletion, if needed

interface PrintTemplateFormModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingTemplate: PrintTemplate | null
  templateName: string
  setTemplateName: (name: string) => void
  templateContent: string
  setTemplateContent: (content: string) => void
  templateType: "receipt" | "pre_receipt"
  setTemplateType: (type: "receipt" | "pre_receipt") => void
  isDefault: boolean
  setIsDefault: (isDefault: boolean) => void
  onSave: () => void
  onPrintTest: () => void
  isSaving: boolean // New prop for saving state
}

export function PrintTemplateFormModal({
  isOpen,
  onOpenChange,
  editingTemplate,
  templateName,
  setTemplateName,
  templateContent,
  setTemplateContent,
  templateType,
  setTemplateType,
  isDefault,
  setIsDefault,
  onSave,
  onPrintTest,
  isSaving, // Destructure new prop
}: PrintTemplateFormModalProps) {
  // Process template content for dynamic preview
  const dynamicPreviewContent = processPrintTemplateContent(templateContent)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? "Chỉnh sửa mẫu in" : "Thêm mẫu in mới"}</DialogTitle>
          <DialogDescription>
            {editingTemplate
              ? "Chỉnh sửa thông tin và nội dung của mẫu in bằng HTML."
              : "Tạo một mẫu in mới bằng HTML cho hóa đơn hoặc tạm tính."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên mẫu
              </Label>
              <Input
                id="name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Loại mẫu
              </Label>
              <Select value={templateType} onValueChange={(value: "receipt" | "pre_receipt") => setTemplateType(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn loại mẫu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receipt">Hóa đơn chính</SelectItem>
                  <SelectItem value="pre_receipt">Tạm tính</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4 flex-1">
              <Label htmlFor="content" className="text-right pt-2">
                Nội dung mẫu (HTML)
              </Label>
              <div className="col-span-3 flex-1 border rounded-md overflow-hidden">
                <AceEditor
                  mode="html"
                  theme="github"
                  name="template_content_editor"
                  editorProps={{ $blockScrolling: true }}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 2,
                  }}
                  value={templateContent}
                  onChange={setTemplateContent}
                  width="100%"
                  height="300px" // Adjust height as needed
                  className="rounded-md"
                />
              </div>
            </div>
            <Card className="col-span-4 bg-blue-50 border-blue-200 text-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Các Placeholder có sẵn</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="mb-2">
                  Sử dụng các placeholder sau trong nội dung HTML của bạn. Hệ thống sẽ tự động thay thế chúng bằng dữ
                  liệu thực tế khi in:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{`{date}`}: Ngày hiện tại của hóa đơn.</li>
                  <li>{`{orderNumber}`}: Mã số đơn hàng.</li>
                  <li>{`{customerName}`}: Tên khách hàng (nếu có).</li>
                  <li>{`{item_count}`}: Tổng số loại sản phẩm trong đơn hàng.</li>
                  <li>
                    {`{items}`}: Danh sách các sản phẩm trong đơn hàng (được render dưới dạng HTML, bao gồm tên sản
                    phẩm, số lượng, mã sản phẩm/barcode và giá).
                  </li>
                  <li>{`{subtotal}`}: Tổng tiền hàng trước thuế và giảm giá.</li>
                  <li>{`{taxAmount}`}: Số tiền thuế.</li>
                  <li>{`{discountAmount}`}: Số tiền giảm giá.</li>
                  <li>{`{totalAmount}`}: Tổng số tiền phải trả sau thuế và giảm giá.</li>
                  <li>{`{receivedAmount}`}: Số tiền khách hàng đã đưa.</li>
                  <li>{`{changeAmount}`}: Số tiền trả lại cho khách hàng.</li>
                  <li>{`{paymentMethod}`}: Phương thức thanh toán.</li>
                </ul>
                <p className="mt-2 text-xs text-blue-700">
                  Lưu ý: Placeholder {`{items}`} sẽ được thay thế bằng một đoạn HTML chứa chi tiết từng sản phẩm.
                </p>
              </CardContent>
            </Card>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isDefault" className="text-right">
                Đặt làm mặc định
              </Label>
              <Checkbox
                id="isDefault"
                checked={isDefault}
                onCheckedChange={(checked: boolean) => setIsDefault(checked)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 border p-4 rounded-md bg-gray-50">
            <h4 className="font-semibold text-center mb-2">Xem trước mẫu in</h4>
            <div className="border border-dashed border-gray-300 p-4 bg-white overflow-y-auto flex-1 min-h-[300px]">
              {/* Use dynamicPreviewContent here */}
              <div dangerouslySetInnerHTML={{ __html: dynamicPreviewContent }} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Lưu ý: Xem trước này hiển thị dữ liệu mẫu. Các placeholder sẽ được điền dữ liệu thực tế khi in.
            </p>
          </div>
        </div>
        <DialogFooter className="flex justify-between items-center">
          <Button variant="outline" onClick={onPrintTest} disabled={isSaving}>
            <Printer className="mr-2 h-4 w-4" /> In thử
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Hủy
            </Button>
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTemplate ? "Lưu thay đổi" : "Lưu mẫu"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
