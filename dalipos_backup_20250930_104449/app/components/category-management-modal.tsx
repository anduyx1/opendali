"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Plus, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/services/categories" // Changed getCategoriesClient to getCategories
import type { Category } from "@/lib/types/database"
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

interface CategoryManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const fetchedCategories = await getCategories() // Used getCategories directly
      if (Array.isArray(fetchedCategories)) {
        setCategories(fetchedCategories)
      } else {
        console.error("getCategories did not return an array:", fetchedCategories)
        setCategories([])
      }
    } catch (error) {
      console.error("Error loading categories:", error)
      toast({
        title: "Lỗi!",
        description: "Không thể tải danh mục.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isOpen) {
      loadCategories()
      setNewCategoryName("")
      setEditingCategory(null)
      setFormError(null)
    }
  }, [isOpen, loadCategories]) // Added loadCategories to dependency array

  const handleAddOrUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!newCategoryName.trim()) {
      setFormError("Tên danh mục không được để trống.")
      return
    }

    setLoading(true)
    try {
      let result
      if (editingCategory) {
        result = await updateCategory(Number(editingCategory.id), newCategoryName)
      } else {
        result = await createCategory(newCategoryName)
      }

      if (result.success) {
        toast({
          title: "Thành công!",
          description: result.data ? "Danh mục đã được tạo thành công" : "Có lỗi xảy ra",
          variant: "default",
        })
        setNewCategoryName("")
        setEditingCategory(null)
        await loadCategories()
      } else {
        setFormError(result.error || "Có lỗi xảy ra")
      }
    } catch (error) {
      console.error("Error saving category:", error)
      setFormError("Có lỗi xảy ra khi lưu danh mục.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category)
    setIsConfirmingDelete(true)
  }

  const confirmDelete = async () => {
    if (!categoryToDelete) return

    setLoading(true)
    setIsConfirmingDelete(false)
    try {
      const result = await deleteCategory(Number(categoryToDelete.id))
      if (result.success) {
        toast({
          title: "Thành công!",
          description: result.data ? "Danh mục đã được xóa thành công" : "Có lỗi xảy ra",
          variant: "default",
        })
        await loadCategories()
      } else {
        toast({
          title: "Lỗi!",
          description: result.error || "Có lỗi xảy ra khi xóa danh mục",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Lỗi!",
        description: "Có lỗi xảy ra khi xóa danh mục.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setCategoryToDelete(null)
    }
  }

  const handleEditClick = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setFormError(null)
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setNewCategoryName("")
    setFormError(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quản lý danh mục sản phẩm</DialogTitle>
          <DialogDescription>Thêm, chỉnh sửa hoặc xóa các danh mục sản phẩm của bạn.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleAddOrUpdateCategory} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="categoryName" className="sr-only">
                Tên danh mục
              </Label>
              <Input
                id="categoryName"
                placeholder={editingCategory ? "Chỉnh sửa tên danh mục" : "Tên danh mục mới"}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={loading}
              />
              {formError && (
                <p className="text-sm font-medium text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {formError}
                </p>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : editingCategory ? (
                <Edit className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {editingCategory ? "Cập nhật" : "Thêm"}
            </Button>
            {editingCategory && (
              <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={loading}>
                Hủy
              </Button>
            )}
          </form>

          <div className="border rounded-md">
            {loading && categories.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">Đang tải danh mục...</div>
            ) : categories.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">Chưa có danh mục nào.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên danh mục</TableHead>
                    <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditClick(category)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteCategory(category)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn danh mục{" "}
              <span className="font-semibold">{categoryToDelete?.name}</span>. Nếu có sản phẩm đang sử dụng danh mục
              này, bạn sẽ không thể xóa nó.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmingDelete(false)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

export default CategoryManagementModal
