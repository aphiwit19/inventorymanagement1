import { Outlet, NavLink as RouterNavLink, useNavigate, useLocation } from 'react-router-dom';
import { Box, Flex, HStack, Link, Text, VStack, Icon, Avatar, Menu, MenuButton, MenuItem, MenuList, useToast, Badge, Button } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { getCurrentUser, logout } from '../services/auth';
import { fetchMyOrders, fetchStaffQueueOrders } from '../services/orders';
import { LayoutDashboard, ClipboardList, ListChecks, LogOut, Bell } from 'lucide-react';

const NavItem = ({ to, icon, children, end, badge }) => (
  <Link
    as={RouterNavLink}
    to={to}
    end={end}
    style={{ width: '100%' }}
    _hover={{ textDecoration: 'none', bg: 'whiteAlpha.200' }}
    _activeLink={{ bg: 'white', color: 'gray.900' }}
    px={3}
    py={2}
    borderRadius="lg"
    display="flex"
    alignItems="center"
    gap={3}
    fontWeight="medium"
    position="relative"
  >
    <Icon as={icon} boxSize={5} />
    <Text>{children}</Text>
    {badge > 0 && (
      <Badge
        position="absolute"
        top="-2px"
        right="-2px"
        bg="red.500"
        color="white"
        borderRadius="full"
        fontSize="10px"
        minW="18px"
        h="18px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {badge > 99 ? '99+' : badge}
      </Badge>
    )}
  </Link>
);

export default function StaffLayout() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
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
                <Text fontSize="xs" color="whiteAlpha.700" fontWeight="medium">Staff Panel</Text>
              </VStack>
            </HStack>
          </VStack>
        </Box>

        {/* Navigation Menu */}
        <Box flex="1" p={4}>
          <VStack align="stretch" spacing={2}>
            <NavItem to="/staff" icon={LayoutDashboard} end>ภาพรวม</NavItem>
            <NavItem to="/staff/queue" icon={ClipboardList} badge={queueCount}>คิวรอจัด</NavItem>
            <NavItem to="/staff/my" icon={ListChecks} badge={myTasksCount}>งานของฉัน</NavItem>
            
            </VStack>
        </Box>
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
