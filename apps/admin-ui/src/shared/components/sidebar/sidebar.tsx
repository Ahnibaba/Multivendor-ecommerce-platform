
"use client"
import useAdmin from '@/hooks/useAdmin'
import useSidebar from '@/hooks/useSidebar'
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'
import Box from '../box'
import { Sidebar } from './sidebar.styles'
import Link from 'next/link'
import Logo from '@/assets/svgs/logo'
import SidebarItem from './sidebar.item'
import Home from '@/assets/icons/home'
import SidebarMenu from './sidebar.menu'
import { BellPlus, BellRing, CalendarPlus, ListOrdered, LogOut, Logs, Mail, Package, PackageSearch, Settings, SquarePlus, TicketPercent, Users } from 'lucide-react'
import Payment from '@/assets/icons/payment'

const SideBarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar()
  const pathName = usePathname()
  const { admin } = useAdmin()

  console.log(admin);
  

  useEffect(() => {
    setActiveSidebar(pathName)
  }, [pathName, setActiveSidebar])

  const getIconColor = (route: string) => activeSidebar === route ? "#0085ff" : "#969696"
  return (
    <Box
      css={{
        height: "100vh",
        zIndex: 202,
        position: "sticky",
        padding: "8px",
        top: "0",
        overflow: "scroll",
        scrollbarWidth: "none"
      }}
    >
       <Sidebar.Header>
         <Box>
           <Link
             href={"/"}
             className="flex justify-center text-center gap-2"
           >
             <Logo />
             <Box>
               <h3 className="text-xl font-medium text-[#ecedee]">
                {admin?.name}
               </h3>
               <h5 className="font-medium text-xs text-[#ecedeecf] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px] text-left">
                 {admin?.email} 
               </h5>
             </Box>
           </Link>
         </Box>
       </Sidebar.Header>

       <div className="block my-3 h-full">
          <Sidebar.Body className="body-sidebar">
             <SidebarItem
               title="Dashboard"
               icon={<Home color={getIconColor("/dashboard")} />}
               isActive={activeSidebar === "/dashboard"}
               href="/dashboard"
             />
             <div className="mt-2 block">
               <SidebarMenu title="Main Menu">
                 <SidebarItem
                   isActive={activeSidebar === "/dashboard/order"}
                   title="Orders"
                   href="/dashboard/orders"
                   icon={
                     <ListOrdered size={26} color={getIconColor("/dashboard/orders")} />
                   }
                 />

                 <SidebarItem
                   isActive={activeSidebar === "/dashboard/payments"}
                   title="Payments"
                   href="/dashboard/payments"
                   icon={<Payment color={getIconColor("/payments")} />}
                 />

                  <SidebarItem
                    isActive={activeSidebar === "/dashboard/products"}
                    title="Products"
                    href="/dashboard/products"
                    icon={
                      <PackageSearch
                        size={22}
                        color={getIconColor("/dashboard/products")}
                      />
                    }
                  />

                  <SidebarItem 
                    isActive={activeSidebar === "/dashboard/events"}
                    title="Events"
                    href="/dashboard/events"
                    icon={
                      <BellPlus
                        size={24}
                        color={getIconColor("/dashboard/events")}
                      />
                    }
                  />
                  <SidebarItem 
                    isActive={activeSidebar === "/dashboard/users"}
                    title="Users"
                    href="/dashboard/users"
                    icon={
                      <Users
                        size={24}
                        color={getIconColor("/dashboard/events")}
                      />
                    }
                  />
                  <SidebarItem 
                    isActive={activeSidebar === "/dashboard/sellers"}
                    title="Sellers"
                    href="/dashboard/sellers"
                    icon={
                      <Package
                        size={24}
                        color={getIconColor("/dashboard/events")}
                      />
                    }
                  />
               
               </SidebarMenu>

               <SidebarMenu title="Controllers">
                  <SidebarItem
                    isActive={activeSidebar === "/dashboard/loggers"}
                    title="Loggers"
                    href="/dashboard/loggers"
                    icon={
                      <Logs size={20} color={getIconColor("/dashboard/inbox")} />
                    }
                  />
                  <SidebarItem
                    isActive={activeSidebar === "/dashboard/management"}
                    title="Management"
                    href="/dashboard/management"
                    icon={
                      <Settings size={20} color={getIconColor("/dashboard/settings")} />
                    }
                  />
                  <SidebarItem
                    isActive={activeSidebar === "/dashboard/notifications"}
                    title="Notifications"
                    href="/dashboard/notifications"
                    icon={
                      <BellRing size={24} color={getIconColor("/dashboard/settings")} />
                    }
                  />
               </SidebarMenu>
               <SidebarMenu title="Customization">
                  <SidebarItem
                    isActive={activeSidebar === "/dashboard/customization"}
                    title="All Customization"
                    href="/dashboard/customization"
                    icon={
                      <TicketPercent
                        size={22}
                        color={getIconColor("/dashboard/customization")}
                      />
                    }
                  />
               </SidebarMenu>
               <SidebarMenu title="Extras">
                  <SidebarItem
                    isActive={activeSidebar === "/dashboard/discount-codes"}
                    title="Discount Codes"
                    href="/dashboard/discount-codes"
                    icon={
                      <TicketPercent
                        size={22}
                        color={getIconColor("/dashboard/discount-codes")}
                      />
                    }
                  />
                  <SidebarItem
                    isActive={activeSidebar === "/logout"}
                    title="Logout"
                    href="/"
                    icon={
                      <LogOut
                        size={20}
                        color={getIconColor("/logout")}
                      />
                    }
                  />
               </SidebarMenu>
             </div>
          </Sidebar.Body>
       </div>
    </Box>
  )
}

export default SideBarWrapper