import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex bg-[#f5f6fa] h-screen overflow-hidden">

      <Sidebar/>

      <div className="flex-1 p-10 overflow-y-auto">
        {children}
      </div>

    </div>
  );
}