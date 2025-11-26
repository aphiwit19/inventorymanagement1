import { Outlet, NavLink as RouterNavLink, useNavigate, useLocation } from 'react-router-dom';
import { Box, Flex, HStack, Link, Text, VStack, Icon, Avatar, Menu, MenuButton, MenuItem, MenuList, useToast, Badge } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { getCurrentUser, logout } from '../services/auth';
import { fetchMyOrders, fetchStaffQueueOrders } from '../services/orders';
import { LayoutDashboard, ClipboardList, ListChecks, LogOut } from 'lucide-react';

const NavItem = ({ to, icon, children, end, badge }) => (
  <Link
    as={RouterNavLink}
    to={to}
    end={end} // ✅ ให้รองรับ end prop
    style={{ width: '100%' }}
    _hover={{ textDecoration: 'none', bg: 'whiteAlpha.200' }}
    _activeLink={{ bg: 'white', color: 'gray.900' }}
    px={3}
    py={2}
    borderRadius="lg"
    display="flex"
    alignItems="center"
    gap={3}
    color="gray.100"
  >
    <Icon as={icon} size={18} />
    <HStack justify="space-between" w="full" spacing={2}>
      <Text fontWeight="medium">{children}</Text>
      {badge > 0 && (
        <Badge colorScheme="green" borderRadius="full" px={2} fontSize="xs">
          {badge}
        </Badge>
      )}
    </HStack>
  </Link>
);

export default function StaffLayout() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const [queueCount, setQueueCount] = useState(0);
  const [myTasksCount, setMyTasksCount] = useState(0);
  const [badgeRefreshTrigger, setBadgeRefreshTrigger] = useState(0);

  const refreshBadgeCounts = () => {
    setBadgeRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [queueOrders, { pagination: preparingPag }] = await Promise.all([
          fetchStaffQueueOrders().catch(() => []),
          fetchMyOrders({ status: 'PREPARING', page: 1, limit: 1 }).catch(() => ({ pagination: null })),
        ]);
        if (!active) return;
        const pendingTotal = Array.isArray(queueOrders) ? queueOrders.length : 0;
        const preparingTotal = preparingPag?.total ?? 0;
        setQueueCount(Number.isFinite(pendingTotal) ? pendingTotal : 0);
        setMyTasksCount(Number.isFinite(preparingTotal) ? preparingTotal : 0);
      } catch {
        if (!active) {
          return;
        }
        setQueueCount(0);
        setMyTasksCount(0);
      }
    })();
    return () => {
      active = false;
    };
  }, [location.pathname, badgeRefreshTrigger]);

  useEffect(() => {
    const handleOrderAccepted = () => {
      refreshBadgeCounts();
    };
    
    window.addEventListener('orderAccepted', handleOrderAccepted);
    return () => {
      window.removeEventListener('orderAccepted', handleOrderAccepted);
    };
  }, []);

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
        <VStack align="flex-start" spacing={1}>
          <Text fontSize="xl" fontWeight="bold">Staff</Text>
          <Text fontSize="sm" color="whiteAlpha.700">ศูนย์งานจัดสินค้า</Text>
        </VStack>

        <VStack align="stretch" spacing={1}>
          {/* ✅ เพิ่ม end เพื่อให้ active แค่ตอนอยู่ /staff */}
          <NavItem to="/staff" icon={LayoutDashboard} end>Dashboard</NavItem>
          <NavItem to="/staff/queue" icon={ClipboardList} badge={queueCount}>คิวรอจัด</NavItem>
          <NavItem to="/staff/my" icon={ListChecks} badge={myTasksCount}>งานของฉัน</NavItem>
        </VStack>
      </Box>

      {/* Content */}
      <Box as="main" flex="1" p={{ base: 5, md: 8 }}>
        <Box bg="white" borderRadius="xl" boxShadow="sm" px={4} py={3} mb={5}>
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">InventoryX Staff</Text>
            <HStack>
              <Menu>
                <MenuButton>
                  <HStack>
                    <Avatar size="sm" name={user?.name || 'Staff'} />
                    <Text display={{ base: 'none', md: 'block' }}>
                      {user?.name || 'Staff'}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => navigate('/staff/profile')}>โปรไฟล์</MenuItem>
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

        <Outlet />
      </Box>
    </Flex>
  );
}
