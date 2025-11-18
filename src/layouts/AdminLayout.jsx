import { Outlet, NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import {
  Box, Flex, HStack, Link, Text, Avatar,
  Menu, MenuButton, MenuItem, MenuList,
  VStack, Icon, Badge, useToast, Button,
  AlertDialog, AlertDialogBody, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, useDisclosure
} from '@chakra-ui/react';
import {
  LayoutDashboard, ClipboardList, Package,
  LogOut, Boxes, Bell, Users
} from 'lucide-react';
import { getCurrentUser, logout } from '../services/auth';
import { listNotifications } from '../services/notifications';
import { storage } from '../services/storage';

// ✅ ปรับ NavItem ให้รองรับ prop end และเพิ่ม hover effect
const NavItem = ({ to, icon, children, end }) => (
  <RouterNavLink
    to={to}
    end={end}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      borderRadius: '10px',
      textDecoration: 'none',
      width: '100%',
      backgroundColor: isActive ? 'white' : 'transparent',
      color: isActive ? '#1A202C' : '#E2E8F0', // สีดำ/เทาอ่อน
      fontWeight: 500,
      transition: '0.2s',
    })}
    className="nav-link"
  >
    <Icon as={icon} size={18} />
    <Text>{children}</Text>
  </RouterNavLink>
);

export default function AdminLayout() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const toast = useToast();
  const unread = (listNotifications() || []).filter(n => !n.read).length;
  const { isOpen: isClearOpen, onOpen: openClear, onClose: closeClear } = useDisclosure();
  const cancelRef = useRef();

  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Sidebar */}
      <Box
        as="aside"
        w={{ base: 64, md: 72 }}
        bgGradient="linear(to-b, gray.900, gray.800)"
        color="white"
        p={5}
        display="flex"
        flexDirection="column"
        gap={5}
      >
        {/* โลโก้ + ข้อความ */}
        <VStack align="flex-start" spacing={1}>
          <Text fontSize="xl" fontWeight="bold">InventoryX Admin</Text>
          <Text fontSize="sm" color="whiteAlpha.700">จัดการระบบหลังบ้าน</Text>
        </VStack>

        {/* เมนู Sidebar */}
        <VStack align="stretch" spacing={1}>
          <NavItem to="/admin" icon={LayoutDashboard} end>ภาพรวม</NavItem>
          <NavItem to="/admin/products" icon={Package}>สินค้า</NavItem>
          <NavItem to="/admin/orders" icon={ClipboardList}>คำสั่งซื้อ</NavItem>
          <NavItem to="/admin/requisitions" icon={ClipboardList}>การเบิก</NavItem>
          <NavItem to="/admin/stock" icon={Boxes}>ประวัติสินค้าเข้า-ออก</NavItem>
          <NavItem to="/admin/users" icon={Users}>ผู้ใช้</NavItem>
          {/* แถวการแจ้งเตือนพร้อม Badge ตัวเลขที่ Sidebar */}
          <RouterNavLink
            to="/admin/notifications"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
              borderRadius: '10px', textDecoration: 'none', width: '100%',
              backgroundColor: isActive ? 'white' : 'transparent',
              color: isActive ? '#1A202C' : '#E2E8F0', fontWeight: 500, transition: '0.2s',
              justifyContent: 'space-between',
            })}
          >
            <HStack spacing={3}>
              <Icon as={Bell} size={18} />
              <Text>การแจ้งเตือน</Text>
            </HStack>
            {unread > 0 && (
              <Badge colorScheme="red" borderRadius="full">{unread}</Badge>
            )}
          </RouterNavLink>
        </VStack>
      </Box>

      {/* Main Content */}
      <Box as="main" flex="1" p={{ base: 5, md: 8 }}>
        {/* Topbar */}
        <Box bg="white" borderRadius="xl" boxShadow="sm" px={4} py={3} mb={5}>
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">InventoryX Admin</Text>

            <HStack>
              {/* Profile menu */}
              <Menu>
                <MenuButton>
                  <HStack>
                    <Avatar size="sm" name={user?.name || 'Admin'} />
                    <Text display={{ base: 'none', md: 'block' }}>
                      {user?.name || 'Admin'}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => navigate('/admin/profile')}>โปรไฟล์</MenuItem>
                  <MenuItem onClick={openClear}>ล้างข้อมูลเดโม่</MenuItem>
                  <MenuItem
                    icon={<Icon as={LogOut} />}
                    onClick={() => {
                      logout();
                      toast({ title: 'ออกจากระบบแล้ว', status: 'info' });
                      navigate('/');
                    }}
                  >
                    ออกจากระบบ
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </Box>

        {/* แสดงเนื้อหาแต่ละหน้า */}
        <Outlet />

        {/* Confirm clear data dialog */}
        <AlertDialog
          isOpen={isClearOpen}
          leastDestructiveRef={cancelRef}
          onClose={closeClear}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader>ยืนยันการล้างข้อมูลเดโม่</AlertDialogHeader>
              <AlertDialogBody>
                การล้างข้อมูลจะลบคำสั่งซื้อ ใบเบิก สินค้า ประวัติสต็อก และการแจ้งเตือนทั้งหมดภายใต้ระบบนี้ และจะรีเฟรชหน้าอัตโนมัติ
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={closeClear} mr={3}>ยกเลิก</Button>
                <Button
                  colorScheme="red"
                  onClick={() => {
                    // ลบเฉพาะข้อมูลผู้ใช้และ session
                    storage.remove('users');
                    storage.remove('session');
                    toast({ title: 'ล้างข้อมูลผู้ใช้แล้ว', status: 'success' });
                    closeClear();
                    setTimeout(() => {
                      window.location.href = '/login';
                    }, 400);
                  }}
                >
                  ล้างข้อมูลผู้ใช้
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </Flex>
  );
}
