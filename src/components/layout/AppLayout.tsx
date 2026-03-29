import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  FileText,
  CreditCard,
  FolderOpen,
  Users,
  ClipboardList,
  Scale,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

const purchaserNavItems = [
  { path: "/purchaser", label: "Dashboard", icon: Home },
  { path: "/purchaser/plots", label: "My Plots", icon: FileText },
  { path: "/purchaser/payments", label: "Payments", icon: CreditCard },
  { path: "/purchaser/documents", label: "Documents", icon: FolderOpen },
  // { path: '/purchaser/cases', label: 'Legal Cases', icon: Scale },
];

const serviceProviderNavItems = [
  { path: "/service-provider", label: "Dashboard", icon: Home },
  { path: "/service-provider/plots", label: "Plot Management", icon: FileText },
  {
    path: "/service-provider/work-queue",
    label: "Work Queue",
    icon: ClipboardList,
  },
  {
    path: "/service-provider/payments",
    label: "Payments Monitor",
    icon: CreditCard,
  },
  { path: "/service-provider/cases", label: "Cases", icon: Scale },
  {
    path: "/service-provider/documents",
    label: "Documents & Issuance",
    icon: FolderOpen,
  },
  { path: "/service-provider/audit-log", label: "Audit Log", icon: History },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPurchaser = user?.role === "purchaser";
  const navItems = isPurchaser ? purchaserNavItems : serviceProviderNavItems;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Get user name from populated purchaserId or serviceProviderId
  const getUserName = () => {
    if (!user) return "User";

    // Check if purchaserId is populated with Purchase object
    if (user.purchaserId && typeof user.purchaserId === "object") {
      return user.purchaserId.name || "User";
    }

    // Check if serviceProviderId is populated with ServiceProvider object
    if (user.serviceProviderId && typeof user.serviceProviderId === "object") {
      return user.serviceProviderId.name || "User";
    }

    // Fallback to email username
    return user.email.split("@")[0] || "User";
  };

  // Get user image
  const getUserImage = () => {
    if (!user) return undefined;
    let uri = "";

    if (
      user.purchaserId &&
      typeof user.purchaserId !== "string" &&
      user.purchaserId?.imageUri
    ) {
      uri = user.purchaserId.imageUri;
    } else if (
      user.serviceProviderId &&
      typeof user.serviceProviderId !== "string" &&
      user.serviceProviderId?.imageUri
    ) {
      uri = user.serviceProviderId.imageUri;
    }

    if (uri) {
      if (uri.startsWith("http")) return uri;
      const baseUrl =
        import.meta.env.VITE_API_URL?.replace("/api", "") ||
        "https://real-estate-backend-blond.vercel.app";
      return `${baseUrl}/${uri}`;
    }
    return undefined;
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-20",
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-lg">
                H
              </span>
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-lg">Hasan</h1>
                <p className="text-xs text-sidebar-foreground/60">
                  Enterprises
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-3",
                  isActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground",
                  !isActive &&
                    "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="animate-fade-in">{item.label}</span>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChevronRight
              className={cn(
                "w-5 h-5 transition-transform",
                sidebarOpen && "rotate-180",
              )}
            />
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-lg">
                H
              </span>
            </div>
            <div>
              <h1 className="font-bold text-lg">Hasan</h1>
              <p className="text-xs text-sidebar-foreground/60">Enterprises</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-3",
                  isActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground",
                  !isActive &&
                    "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="font-semibold text-lg">
                {isPurchaser ? "Purchaser Portal" : "Admin Portal"}
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Real Estate Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationCenter />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={getUserImage()}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(getUserName())}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    {getUserName()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{getUserName()}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
