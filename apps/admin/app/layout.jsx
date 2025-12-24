import Sidebar from "@/components/Sidebar";
export default function RootLayout({ children }) {
    return (<html lang="en">
      <body className="bg-[#0B0B0F] text-white">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>);
}
