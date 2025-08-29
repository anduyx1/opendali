import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    // Giảm khoảng cách giữa các mục phân trang xuống gap-0.5 để gọn hơn
    className={cn("flex flex-row items-center gap-0.5", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  // Đặt kích thước mặc định cho PaginationLink là "icon" để có hình vuông
  // Sau đó override kích thước để nhỏ hơn và chữ nhỏ hơn
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      // Override kích thước để làm cho nút nhỏ hơn (h-8 w-8) và chữ nhỏ (text-xs)
      "h-8 w-8 text-xs",
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    // Đặt kích thước cho nút Previous là "icon"
    size="icon"
    // Override kích thước để làm cho nút nhỏ hơn (h-8 w-8) và điều chỉnh padding
    className={cn("h-8 w-8 p-0", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span></span> {/*Previous văn bản được cố ý để trống để căn chỉnh tốt hơn*/}
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    // Đặt kích thước cho nút Next là "icon"
    size="icon"
    // Override kích thước để làm cho nút nhỏ hơn (h-8 w-8) và điều chỉnh padding
    className={cn("h-8 w-8 p-0", className)}
    {...props}
  >
    <span></span> {/*Previous văn bản được cố ý để trống để căn chỉnh tốt hơn*/}
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    // Đã giảm kích thước của PaginationEllipsis xuống h-8 w-8 để đồng bộ với các nút khác
    className={cn("flex h-8 w-8 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
