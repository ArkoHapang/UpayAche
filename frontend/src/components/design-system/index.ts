/**
 * UpayAche Fintech Design System
 * Master Export Barrel File
 */

// Core UI Base
export { Button, buttonVariants } from "@/components/ui/button";
export type { ButtonProps } from "@/components/ui/button";
export { Badge, badgeVariants } from "@/components/ui/badge";
export type { BadgeProps } from "@/components/ui/badge";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
export type { CardProps } from "@/components/ui/card";

// Form Controls
export { Input } from "./Input";
export type { InputProps } from "./Input";
export { Select } from "./Select";
export type { SelectProps, SelectOption } from "./Select";

// Layout & Shell
export { AppShell } from "./AppShell";
export { Sidebar } from "./Sidebar";
export { MobileBottomNav } from "./MobileBottomNav";
export { TopHeader } from "./TopHeader";
export { PageHeader } from "./PageHeader";
export type { PageHeaderProps, BreadcrumbItem } from "./PageHeader";

// Badges & Indicators
export { RiskBadge } from "./RiskBadge";
export type { RiskBadgeProps } from "./RiskBadge";
export { StatusBadge } from "./StatusBadge";
export type { StatusBadgeProps } from "./StatusBadge";

// Cards & Containers
export { MetricCard } from "./MetricCard";
export type { MetricCardProps } from "./MetricCard";
export { TransactionCard } from "./TransactionCard";
export { ServiceCard } from "./ServiceCard";
export { ChartCard } from "./ChartCard";
export { AlertCard } from "./AlertCard";
export { WalletCard } from "./WalletCard";
export { InvestigationCard } from "./InvestigationCard";
export { AIInsightCard } from "./AIInsightCard";
export { NetworkPreviewCard } from "./NetworkPreviewCard";

// Tables, Lists & Search
export { TransactionTable } from "./TransactionTable";
export type { TransactionRow } from "./TransactionTable";
export { DataTable } from "./DataTable";
export type { ColumnDef, DataTableProps } from "./DataTable";
export { SearchBar } from "./SearchBar";
export type { SearchBarProps } from "./SearchBar";
export { FilterBar } from "./FilterBar";
export type { FilterOption } from "./FilterBar";

// Navigation & Tabs
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
} from "./Tabs";

// Dialogs, Drawers & Overlays
export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";
export { Drawer } from "./Drawer";
export type { DrawerProps } from "./Drawer";
export { ConfirmationDialog } from "./ConfirmationDialog";
export { Tooltip } from "./Tooltip";

// Feedback, Loading & Utility
export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";
export { LoadingState } from "./LoadingState";
export type { LoadingStateProps } from "./LoadingState";
export { ErrorState } from "./ErrorState";
export type { ErrorStateProps } from "./ErrorState";

// AI Assistant & Copilot Trigger
export { AIAssistantButton } from "./AIAssistantButton";
export type { AIAssistantButtonProps } from "./AIAssistantButton";
