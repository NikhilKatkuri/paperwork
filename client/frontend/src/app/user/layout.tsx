import Dashboard from "@/features/user/components/layouts/Dashboard";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Dashboard>
        {children} 
    </Dashboard>
  );
}