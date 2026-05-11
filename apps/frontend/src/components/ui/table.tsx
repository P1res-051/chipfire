import * as React from 'react'

import { cn } from '@/lib/utils'

export function Table(props: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full max-w-full overflow-x-auto rounded-lg border border-primary/15">
      <table 
        className={cn(
          'w-full caption-bottom text-sm',
          'border-collapse',
          'table-fixed',
          props.className
        )} 
        {...props} 
      />
    </div>
  )
}

export function TableHeader(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead 
      className={cn(
        'bg-secondary/40 border-b border-primary/20',
        props.className
      )} 
      {...props} 
    />
  )
}

export function TableBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody 
      className={cn(
        '[&_tr:last-child]:border-0',
        props.className
      )} 
      {...props} 
    />
  )
}

export function TableRow(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-primary/10 transition-all duration-150',
        'hover:bg-secondary/25',
        'data-[state=selected]:bg-secondary/40 data-[state=selected]:border-primary/30',
        props.className,
      )}
      {...props}
    />
  )
}

export function TableHead(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-12 px-4 py-3 text-left align-middle font-semibold text-muted-foreground/80',
        'whitespace-nowrap',
        props.className
      )}
      {...props}
    />
  )
}

export function TableCell(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td 
      className={cn(
        'px-4 py-3 align-middle',
        'break-words',
        props.className
      )} 
      {...props} 
    />
  )
}

export function TableCaption(props: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption 
      className={cn(
        'mt-4 text-sm text-muted-foreground',
        props.className
      )} 
      {...props} 
    />
  )
}

export function TableFooter(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot 
      className={cn(
        'bg-secondary/30 border-t border-primary/20 font-medium',
        props.className
      )} 
      {...props} 
    />
  )
}
