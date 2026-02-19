"use client";
import { useSidebar } from "./SidebarProvider";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
  sidebar,
  header,
}: {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
} & React.PropsWithChildren) {
  const { isCollapsedSidebar } = useSidebar();
  const sidebarWidth = isCollapsedSidebar
    ? "--_sidebar-collapsed"
    : "--_sidebar-expanded";
  return (
    <div
      style={
        {
          "--_sidebar-spacing": "1rem",
          "--_sidebar-collapsed": "4rem",
          "--_sidebar-expanded": "16.25rem",
          "--_sidebar-icon-container": "2rem",
          "--_sidebar-icon-sm": "1.5rem",
          "--_sidebar-icon-lg": "1.7rem",
          "--_sidebar-header-height": "4.5rem",
          "--_sidebar-footer-height": "4.5rem",
          gridTemplateColumns: `var(${sidebarWidth}) 1fr`,
          gridTemplateAreas: `'sidebar main'`,
        } as React.CSSProperties
      }
      className={cn(`grid transition-[grid] duration-300 bg-dark3 p-4 gap-4`)}
    >
      <div className="[grid-area:sidebar] print:hidden">{sidebar}</div>
      <div className="[grid-area:main] min-w-0">
        <div className="sticky top-4 z-50 before:absolute before:inset-0 before:-translate-y-4 before:bg-dark3 before:-z-10">
          <div className="bg-dark2 border-b border-l border-l-dark3 border-b-dark3 shadow backdrop-blur">
            {header}
          </div>
        </div>
        <div className="bg-dark3 min-h-[calc(100vh-6.6rem)] border-l border-l-dark3 shadow-xs">
          {children}
        </div>
      </div>
    </div>
  );
}
