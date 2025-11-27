import { Outlet, NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import {
  Box, Flex, HStack, Link, Text, Avatar,
  Menu, MenuButton, MenuItem, MenuList,
  VStack, Icon, Badge, useToast, Button
} from '@chakra-ui/react';
import {
  LayoutDashboard, ClipboardList, Package,
  LogOut, Boxes, Bell, Users
} from 'lucide-react';
import { getCurrentUser, logout } from '../services/auth';
import { listNotifications } from '../services/notifications';

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

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast({
      title: 'ออกจากระบบสำเร็จ',
      description: 'คุณได้ออกจากระบบเรียบร้อยแล้ว',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Sidebar */}
      <Box
        as="aside"
        position="sticky"
        top="0"
        h="100vh"
        w={{ base: 64, md: 72 }}
        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        color="white"
        p={0}
        display="flex"
        flexDirection="column"
        overflowY="auto"
        boxShadow="xl"
      >
        {/* Header Section */}
        <Box
          p={6}
          borderBottom="1px solid"
          borderColor="whiteAlpha.200"
          bg="rgba(255, 255, 255, 0.05)"
        >
          <VStack align="flex-start" spacing={2}>
            <HStack spacing={3}>
              <Box
                w={10}
                h={10}
                bg="whiteAlpha.20"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                backdropBlur="sm"
              >
                <Icon as={LayoutDashboard} boxSize={5} />
              </Box>
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="xl" fontWeight="bold">InventoryX</Text>
                <Text fontSize="xs" color="whiteAlpha.700" fontWeight="medium">Admin Panel</Text>
              </VStack>
            </HStack>
          </VStack>
        </Box>

        {/* Navigation Menu */}
        <Box flex="1" p={4}>
          <VStack align="stretch" spacing={2}>
            <NavItem to="/admin" icon={LayoutDashboard} end>ภาพรวม</NavItem>
            <NavItem to="/admin/products" icon={Package}>สินค้า</NavItem>
            <NavItem to="/admin/orders" icon={ClipboardList}>คำสั่งซื้อ</NavItem>
            <NavItem to="/admin/requisitions" icon={ClipboardList}>การเบิก</NavItem>
            <NavItem to="/admin/stock" icon={Boxes}>ประวัติสินค้าเข้า-ออก</NavItem>
            <NavItem to="/admin/users" icon={Users}>ผู้ใช้</NavItem>
            
            {/* Notifications with Badge */}
            <RouterNavLink
              to="/admin/notifications"
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                borderRadius: '12px', textDecoration: 'none', width: '100%',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255, 255, 255, 0.8)', fontWeight: 500, transition: '0.2s',
                justifyContent: 'space-between', backdropFilter: 'blur(10px)',
              })}
            >
              <HStack spacing={3}>
                <Icon as={Bell} size={18} />
                <Text fontSize="sm">การแจ้งเตือน</Text>
              </HStack>
              {unread > 0 && (
                <Badge 
                  bg="red.500" 
                  color="white" 
                  borderRadius="full" 
                  fontSize="10px"
                  px={2}
                  py={1}
                  minW="20px"
                  textAlign="center"
                >
                  {unread}
                </Badge>
              )}
            </RouterNavLink>
          </VStack>
        </Box>
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
                  <MenuItem
                    icon={<Icon as={LogOut} />}
                    onClick={async () => {
                      await logout();
                      toast({ title: 'ออกจากระบบแล้ว', status: 'info' });
                      navigate('/login', { replace: true });
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

      </Box>
    </Flex>
  );
}
