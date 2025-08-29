"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  Loader2,
  FileText,
  Eye,
  Copy,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Code,
  Save,
  X,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  getAllPrintTemplates,
  createPrintTemplate,
  updatePrintTemplate,
  deletePrintTemplate,
  setDefaultPrintTemplate,
} from "@/lib/actions/print-templates"
import type { PrintTemplate } from "@/lib/types/database"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SimplePlaceholderSelector } from "@/components/simple-placeholder-selector"

interface BusinessSettings {
  store_name?: string
  store_address?: string
  store_phone?: string
  store_email?: string
  [key: string]: unknown
}

interface LineItem {
  name: string
  quantity: string
  price: string
  amount: string
  [key: string]: unknown
}

export default function PrintTemplatesPage() {
  const [templates, setTemplates] = useState<PrintTemplate[]>([])
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateContent, setTemplateContent] = useState("")
  const [templateType, setTemplateType] = useState<"receipt" | "pre_receipt">("receipt")
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})
  const [isSettingDefault, setIsSettingDefault] = useState<Record<string, boolean>>({})

  // Preview dialog states
  const [previewTemplate, setPreviewTemplate] = useState<PrintTemplate | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Alert dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)
  const [isSetDefaultDialogOpen, setIsSetDefaultDialogOpen] = useState(false)
  const [templateToSetDefault, setTemplateToSetDefault] = useState<{
    id: string
    type: "receipt" | "pre_receipt"
  } | null>(null)

  // Rich text editor states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [selectedFont, setSelectedFont] = useState("Arial")
  const [selectedFontSize, setSelectedFontSize] = useState("14")
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const fetchedTemplates = await getAllPrintTemplates()
      setTemplates(fetchedTemplates)
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách mẫu in.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddTemplate = () => {
    setEditingTemplate(null)
    setTemplateName("")
    setTemplateContent("")
    setTemplateType("receipt")
    setIsDefault(false)
    setIsEditDialogOpen(true)
  }

  const handleEditTemplate = (template: PrintTemplate) => {
    setEditingTemplate(template)
    setTemplateName(template.name)
    setTemplateContent(template.content)
    setTemplateType(template.type)
    setIsDefault(template.is_default)
    setIsEditDialogOpen(true)
  }

  const handlePreviewTemplate = (template: PrintTemplate) => {
    setPreviewTemplate(template)
    setIsPreviewOpen(true)
  }

  const handleCopyTemplate = async (template: PrintTemplate) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(template.content)
        toast({
          title: "Thành công",
          description: "Đã sao chép nội dung mẫu in.",
        })
      } else {
        // Fallback method
        const textArea = document.createElement("textarea")
        textArea.value = template.content
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        toast({
          title: "Thành công",
          description: "Đã sao chép nội dung mẫu in.",
        })
      }
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép nội dung.",
        variant: "destructive",
      })
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !templateContent.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên mẫu và nội dung không được để trống.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      if (editingTemplate) {
        const result = await updatePrintTemplate(
          editingTemplate.id.toString(),
          templateName,
          templateContent,
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
        const result = await createPrintTemplate(templateName, templateContent, templateType, isDefault)
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
      setIsEditDialogOpen(false)
      fetchTemplates()
    } catch {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi lưu mẫu in.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDeleteTemplate = (id: string) => {
    setTemplateToDelete(id)
    setIsDeleteDialogOpen(true)
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
        fetchTemplates()
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể xóa mẫu in.",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi xóa mẫu in.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting((prev) => ({ ...prev, [templateToDelete]: false }))
      setIsDeleteDialogOpen(false)
      setTemplateToDelete(null)
    }
  }

  const confirmSetDefault = (id: string, type: "receipt" | "pre_receipt") => {
    setTemplateToSetDefault({ id, type })
    setIsSetDefaultDialogOpen(true)
  }

  const executeSetDefault = async () => {
    if (!templateToSetDefault) return

    setIsSettingDefault((prev) => ({ ...prev, [templateToSetDefault.id]: true }))
    try {
      const result = await setDefaultPrintTemplate(templateToSetDefault.id, templateToSetDefault.type)
      if (result.success) {
        toast({
          title: "Thành công",
          description: "Mẫu in mặc định đã được cập nhật.",
        })
        fetchTemplates()
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể đặt làm mặc định.",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi đặt mẫu mặc định.",
        variant: "destructive",
      })
    } finally {
      setIsSettingDefault((prev) => ({ ...prev, [templateToSetDefault.id]: false }))
      setIsSetDefaultDialogOpen(false)
      setTemplateToSetDefault(null)
    }
  }

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      setTemplateContent(editorRef.current.innerHTML)
    }
  }

  const handleEditorChange = () => {
    if (editorRef.current) {
      setTemplateContent(editorRef.current.innerHTML)
    }
  }

  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Switch from HTML to WYSIWYG
      if (editorRef.current) {
        editorRef.current.innerHTML = templateContent
      }
    } else {
      // Switch from WYSIWYG to HTML
      if (editorRef.current) {
        setTemplateContent(editorRef.current.innerHTML)
      }
    }
    setIsHtmlMode(!isHtmlMode)
  }

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        toast({
          title: "Đã sao chép",
          description: "Nội dung đã được sao chép vào clipboard.",
        })
      } else {
        // Fallback method
        const textArea = document.createElement("textarea")
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        toast({
          title: "Đã sao chép",
          description: "Nội dung đã được sao chép vào clipboard.",
        })
      }
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép nội dung.",
        variant: "destructive",
      })
    }
  }

  const placeholderData = {
    store_name: "Cửa hàng ABC",
    store_address: "123 Đường ABC, Quận 1, TP.HCM",
    store_phone: "0123 456 789",
    store_email: "contact@abc.com",
    customer_name: "Nguyễn Văn A",
    customer_phone: "0987 654 321",
    order_code: "HD001",
    created_on: "2024-01-15",
    created_on_time: "14:30:25",
    total: "150,000",
    total_discount: "10,000",
    total_amount: "140,000",
    total_quantity: "3",
    line_items: [
      { name: "Sản phẩm A", quantity: "1", price: "50,000", amount: "50,000" },
      { name: "Sản phẩm B", quantity: "2", price: "45,000", amount: "90,000" },
    ],
  }

  const processPrintTemplateContent = (content: string, settings?: BusinessSettings) => {
    let processedContent = content

    // Replace placeholders with settings data or sample data
    const data = settings || placeholderData
    Object.entries(data).forEach(([key, value]) => {
      if (key === "line_items") return
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g")
      processedContent = processedContent.replace(regex, value as string)
    })

    // Handle line items
    const lineItemsRegex = /\{\{#line_items\}\}([\s\S]*?)\{\{\/line_items\}\}/g
    processedContent = processedContent.replace(lineItemsRegex, (match, template) => {
      return (data.line_items as LineItem[])
        .map((item: LineItem) => {
          let itemContent = template
          Object.entries(item).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{line_${key}\\}\\}`, "g")
            itemContent = itemContent.replace(regex, value)
          })
          return itemContent
        })
        .join("")
    })

    return processedContent
  }

  const renderPreview = async () => {
    try {
      // Fetch business settings for preview
      const response = await fetch("/api/settings/business")
      const businessSettings = response.ok ? await response.json() : null

      return processPrintTemplateContent(templateContent, businessSettings)
    } catch {
      return processPrintTemplateContent(templateContent)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải mẫu in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mẫu in</h1>
          <p className="text-muted-foreground">Quản lý các mẫu in hóa đơn và tạm tính</p>
        </div>
        <Button onClick={handleAddTemplate} className="w-fit">
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm mẫu in mới
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có mẫu in nào</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Bắt đầu bằng cách tạo mẫu in đầu tiên cho hóa đơn hoặc tạm tính của bạn.
          </p>
          <Button onClick={handleAddTemplate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tạo mẫu in đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-border"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-semibold line-clamp-1">{template.name}</CardTitle>
                  {template.is_default && (
                    <Badge variant="secondary" className="shrink-0 bg-green-100 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mặc định
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {template.type === "receipt" ? "Hóa đơn" : "Tạm tính"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="bg-muted/30 rounded-lg p-3 max-h-32 overflow-hidden relative">
                  <div
                    className="text-xs text-muted-foreground line-clamp-4"
                    dangerouslySetInnerHTML={{ __html: template.content }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-muted/30 to-transparent" />
                </div>
              </CardContent>

              <CardFooter className="pt-0 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreviewTemplate(template)}
                  className="flex-1 min-w-0"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Xem
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyTemplate(template)}
                  className="flex-1 min-w-0"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Sao chép
                </Button>

                <div className="w-full flex gap-2 mt-2">
                  {!template.is_default && (
                    <Button
                      variant="secondary"
                      size="sm"
                                             onClick={() => confirmSetDefault(template.id.toString(), template.type)}
                      disabled={isSettingDefault[template.id]}
                      className="flex-1"
                    >
                      {isSettingDefault[template.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đặt mặc định"}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    disabled={isDeleting[template.id] || isSettingDefault[template.id]}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                                         onClick={() => confirmDeleteTemplate(template.id.toString())}
                    disabled={isDeleting[template.id]}
                  >
                    {isDeleting[template.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Chỉnh sửa mẫu in: {templateName}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleHtmlMode} className="text-xs bg-transparent">
                  <Code className="h-4 w-4 mr-1" />
                  {isHtmlMode ? "Thiết kế" : "Mã HTML"}
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(90vh-120px)]">
            {/* Editor Panel */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Tên mẫu in</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Nhập tên mẫu in..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại mẫu</Label>
                  <Select
                    value={templateType}
                    onValueChange={(value: "receipt" | "pre_receipt") => setTemplateType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receipt">Hóa đơn</SelectItem>
                      <SelectItem value="pre_receipt">Tạm tính</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Switch id="is-default" checked={isDefault} onCheckedChange={setIsDefault} />
                  <Label htmlFor="is-default">Mặc định</Label>
                </div>
              </div>

              {!isHtmlMode && (
                <div className="border rounded-lg">
                  {/* Toolbar */}
                  <div className="border-b p-2 flex flex-wrap gap-1">
                    <SimplePlaceholderSelector
                      onInsert={(placeholder) => {
                        if (editorRef.current) {
                          const selection = window.getSelection()
                          if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0)
                            range.deleteContents()
                            range.insertNode(document.createTextNode(placeholder))
                            range.collapse(false)
                            handleEditorChange()
                          }
                        }
                      }}
                    />

                    <div className="border-l mx-2" />

                    <Select value={selectedFont} onValueChange={setSelectedFont}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="Tahoma">Tahoma</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedFontSize} onValueChange={setSelectedFontSize}>
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="14">14</SelectItem>
                        <SelectItem value="16">16</SelectItem>
                        <SelectItem value="18">18</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="border-l mx-2" />

                    <Button variant="ghost" size="sm" onClick={() => applyFormat("bold")}>
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => applyFormat("italic")}>
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => applyFormat("underline")}>
                      <Underline className="h-4 w-4" />
                    </Button>

                    <div className="border-l mx-2" />

                    <Button variant="ghost" size="sm" onClick={() => applyFormat("justifyLeft")}>
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => applyFormat("justifyCenter")}>
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => applyFormat("justifyRight")}>
                      <AlignRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => applyFormat("justifyFull")}>
                      <AlignJustify className="h-4 w-4" />
                    </Button>

                    <div className="border-l mx-2" />

                    <Button variant="ghost" size="sm" onClick={() => applyFormat("insertUnorderedList")}>
                      <List className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => applyFormat("insertOrderedList")}>
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Editor */}
                  <div
                    ref={editorRef}
                    contentEditable
                    className="min-h-[400px] p-4 focus:outline-none"
                    style={{ fontFamily: selectedFont, fontSize: `${selectedFontSize}px` }}
                    onInput={handleEditorChange}
                    dangerouslySetInnerHTML={{ __html: templateContent }}
                  />
                </div>
              )}

              {isHtmlMode && (
                <div className="space-y-2">
                  <Label>Mã HTML</Label>
                  <Textarea
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="Nhập mã HTML..."
                  />
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Xem trước realtime</Label>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(templateContent)}>
                  <Copy className="h-4 w-4 mr-1" />
                  Sao chép HTML
                </Button>
              </div>

              <div className="border rounded-lg bg-white shadow-sm overflow-auto max-h-[500px]">
                <div className="p-6">
                  <div dangerouslySetInnerHTML={{ __html: renderPreview() }} className="prose prose-sm max-w-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Hủy
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Lưu mẫu in
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Xem trước: {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div dangerouslySetInnerHTML={{ __html: renderPreview() }} className="prose prose-sm max-w-none" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa mẫu in</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa mẫu in này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting[templateToDelete || ""]}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteTemplate}
              disabled={isDeleting[templateToDelete || ""]}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting[templateToDelete || ""] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set Default Confirmation Dialog */}
      <AlertDialog open={isSetDefaultDialogOpen} onOpenChange={setIsSetDefaultDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đặt làm mẫu mặc định</AlertDialogTitle>
            <AlertDialogDescription>
              Mẫu in này sẽ trở thành mẫu mặc định cho loại{" "}
              <span className="font-semibold">
                {templateToSetDefault?.type === "receipt" ? "Hóa đơn chính" : "Tạm tính"}
              </span>
              . Mẫu mặc định hiện tại sẽ bị thay thế.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSettingDefault[templateToSetDefault?.id || ""]}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={executeSetDefault} disabled={isSettingDefault[templateToSetDefault?.id || ""]}>
              {isSettingDefault[templateToSetDefault?.id || ""] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đặt làm mặc định
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
