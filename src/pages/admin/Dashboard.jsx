import { useEffect, useState } from 'react';
import { Box, Heading, SimpleGrid, Stat, StatHelpText, StatLabel, StatNumber, Stack, HStack, Text, VStack, Tag, Icon, Button, IconButton, Badge } from '@chakra-ui/react';
import { fetchMyOrders } from '../../services/orders';
import { fetchAdminProductsPaged, getLowStock } from '../../services/products';
import { getUserStats } from '../../services/users';
import { api } from '../../services/api';
import { ShoppingCart, DollarSign, Clock3, Package, Users, BarChart3, Bell, Check, CheckCircle } from 'lucide-react';

// Admin Dashboard API functions
async function fetchDashboardStats() {
  const res = await api.get('/admin/dashboard');
  return res?.data || res;
}

async function fetchTodayOrders() {
  const res = await api.get('/admin/dashboard/today-orders');
  return res?.data || res;
}

async function fetchRevenue() {
  const res = await api.get('/admin/dashboard/revenue');
  return res?.data || res;
}

async function fetchSalesChart() {
  const res = await api.get('/admin/dashboard/sales-chart');
  return res?.data || res;
}

async function fetchRecentOrders() {
  const res = await api.get('/admin/dashboard/recent-orders?limit=5');
  return res?.data || res;
}

// New notification API functions
async function fetchLowStockNotifications() {
  try {
    console.log('Dashboard: Fetching low stock notifications...');
    const res = await api.get('/notifications/low-stock?page=1&limit=5');
    console.log('Dashboard: Low stock API response:', res);
    // Handle different response structures
    const notifications = res?.notifications || res?.data?.notifications || [];
    return notifications;
  } catch (error) {
    console.error('Dashboard: fetchLowStockNotifications failed', error);
    // Fallback to old method if new endpoint doesn't exist
    try {
      console.log('Dashboard: Trying fallback for low stock notifications...');
      const { getNotifications } = await import('../../services/notifications');
      const allNotifications = await getNotifications();
      return allNotifications.filter(n => n.type === 'low_stock').slice(0, 5);
    } catch (fallbackError) {
      console.error('Dashboard: Fallback also failed', fallbackError);
      return [];
    }
  }
}

async function fetchStaffActivityNotifications() {
  try {
    console.log('Dashboard: Fetching staff activity notifications...');
    const res = await api.get('/notifications/staff-activity?page=1&limit=5');
    console.log('Dashboard: Staff activity API response:', res);
    // Handle different response structures
    const notifications = res?.notifications || res?.data?.notifications || [];
    return notifications;
  } catch (error) {
    console.error('Dashboard: fetchStaffActivityNotifications failed', error);
    // Fallback to old method if new endpoint doesn't exist
    try {
      console.log('Dashboard: Trying fallback for staff activity notifications...');
      const { getNotifications } = await import('../../services/notifications');
      const allNotifications = await getNotifications();
      return allNotifications.filter(n => n.type === 'staff_activity' || n.type === 'order_accepted').slice(0, 5);
    } catch (fallbackError) {
      console.error('Dashboard: Fallback also failed', fallbackError);
      return [];
    }
  }
}

async function fetchProductsCount() {
  try {
    console.log('fetchProductsCount: Using same API as admin products page...');
    // Use the same function as admin products page
    const result = await fetchAdminProductsPaged({ page: 1, limit: 1 });
    console.log('fetchProductsCount: Full API result:', result);
    
    // Extract total from different possible response structures
    const total = result?.pagination?.total || result?.total || 0;
    console.log('fetchProductsCount: Extracted total:', total);
    
    // If still 0, try direct API call as fallback
    if (total === 0) {
      console.log('fetchProductsCount: Trying direct API call as fallback...');
      try {
        const directRes = await api.get('/products?page=1&limit=1');
        console.log('fetchProductsCount: Direct API response:', directRes);
        const directTotal = directRes?.data?.pagination?.total || directRes?.pagination?.total || 0;
        console.log('fetchProductsCount: Direct total:', directTotal);
        return { total: directTotal };
      } catch (directError) {
        console.error('fetchProductsCount: Direct API call failed', directError);
      }
    }
    
    return { total }; // Return in the expected format
  } catch (error) {
    console.error('fetchProductsCount: API call failed', error);
    // Return 0 as fallback
    return { total: 0 };
  }
}

export default function Dashboard() {
  const [productsCount, setProductsCount] = useState(0);
  const [userStats, setUserStats] = useState({});
  const [ordersSummary, setOrdersSummary] = useState({ 
    totalRevenue: 0, 
    pending: 0, 
    inProgress: 0, 
    readyToShip: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    todayOrders: 0, 
    todayRevenue: 0, 
    readyForAdmin: 0 
  });
  const [months, setMonths] = useState([]);
  const [latestOrders, setLatestOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [lowStock, setLowStock] = useState([]);

  // Function to mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      console.log('Dashboard: Marking notification as read:', notificationId);
      await api.patch(`/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      
      // Update unread count
      setUnread(prev => Math.max(0, prev - 1));
      
      console.log('Dashboard: Successfully marked notification as read');
    } catch (error) {
      console.error('Dashboard: Failed to mark notification as read', error);
    }
  };

  useEffect(() => {
    console.log('Dashboard: Products count useEffect triggered');
    let active = true;
    (async () => {
      try {
        console.log('Dashboard: Starting fetchProductsCount...');
        // Products count via dedicated API
        const productsData = await fetchProductsCount();
        console.log('Dashboard: Raw API response:', productsData);
        if (!active) return;
        console.log('Dashboard: Products count from API:', productsData);
        console.log('Dashboard: Setting productsCount to:', productsData?.total || 0);
        setProductsCount(productsData?.total || 0);
      } catch (error) {
        console.error('Dashboard: fetchProductsCount failed', error);
        console.log('Dashboard: Error details:', error.message, error.stack);
        if (active) setProductsCount(0);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        console.log('Dashboard: Fetching user stats...');
        const statsRes = await getUserStats().catch(e => {
          console.error('Dashboard: getUserStats failed', e);
          return {};
        });
        
        if (!active) return;
        console.log('Dashboard: User stats from API:', statsRes);
        setUserStats(statsRes || {});
      } catch (error) {
        console.error('Dashboard: Failed to fetch user stats', error);
        if (active) setUserStats({});
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Use the same API as Notifications page
        const { getNotifications } = await import('../../services/notifications');
        const allNotifications = await getNotifications();
        
        if (!active) return;
        
        console.log('Dashboard: All notifications from API:', allNotifications);
        
        // Debug: ตรวจสอบว่ามี low stock จริงหรือไม่
        const lowStockInAdmin = allNotifications.filter(n => 
          n.type === 'low_stock' || 
          n.title?.includes('Low Stock Alert') ||  // แก้ไขตามข้อมูลจริง
          n.message?.includes('running low') ||
          n.message?.includes('Current stock:')
        );
        console.log('Dashboard: Low stock notifications found in admin:', lowStockInAdmin);
        console.log('Dashboard: All notification types:', [...new Set(allNotifications.map(n => n.type))]);
        
        // Debug: แสดงรายละเอียดทุกรายการ
        console.log('Dashboard: All notification details:');
        allNotifications.forEach((n, index) => {
          console.log(`  ${index + 1}. Title: "${n.title}" | Type: ${n.type} | Message: "${n.message}"`);
        });
        
        // Filter for recent notifications (last 5)
        const recentNotifications = allNotifications.slice(0, 5);
        
        console.log('Dashboard: Recent notifications:', recentNotifications);
        
        setNotifications(recentNotifications);
        setUnread(recentNotifications.filter(n => !(n.isRead || n.read)).length);
      } catch (error) {
        console.error('Dashboard: Failed to fetch notifications', error);
        if (active) {
          setNotifications([]);
          setUnread(0);
        }
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Fetch recent orders and compute simple summaries on client as fallback
        const { orders } = await fetchMyOrders({ page: 1, limit: 50 }); // เพิ่ม limit เพื่อดึงข้อมูลมากขึ้น
        if (!active) return;
        const list = Array.isArray(orders) ? orders : [];
        
        // Debug: แสดงจำนวนออเดอร์ที่ดึงได้
        console.log('Dashboard: ดึงออเดอร์ได้', list.length, 'รายการ');
        
        const today = new Date();
        const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
        const sumOrder = (o) => {
          // ใช้ totalAmount ถ้ามี ไม่งั้นคำนวณจาก items
          if (o.totalAmount) return Number(o.totalAmount);
          return (o.items||[]).reduce((s,i)=> s + Number(i.price||i.unitPrice||0) * Number(i.qty||i.quantity||0), 0);
        };
        
        const totalRevenue = list.reduce((s,o)=> s + sumOrder(o), 0);
        const pending = list.filter(o=> o.status === 'PENDING_CONFIRMATION').length;
        const inProgress = list.filter(o=> o.status === 'PREPARING').length;
        const readyToShip = list.filter(o=> o.status === 'READY_TO_SHIP').length;
        const shipped = list.filter(o=> o.status === 'SHIPPED').length;
        const delivered = list.filter(o=> o.status === 'DELIVERED').length;
        const cancelled = list.filter(o=> o.status === 'CANCELLED').length;
        
        const todayOrders = list.filter(o=> isSameDay(new Date(o.createdAt), today)).length;
        const todayRevenue = list.filter(o=> isSameDay(new Date(o.createdAt), today)).reduce((s,o)=> s + sumOrder(o), 0);
        const readyForAdmin = list.filter(o=> o.status === 'READY_TO_SHIP').length;
        
        // Debug: แสดงสถิติ
        console.log('Dashboard stats:', { 
          totalRevenue, 
          pending, 
          inProgress, 
          readyToShip,
          shipped,
          delivered,
          cancelled,
          todayOrders, 
          todayRevenue, 
          readyForAdmin 
        });
        
        setOrdersSummary({ 
          totalRevenue, 
          pending, 
          inProgress, 
          readyToShip,
          shipped,
          delivered,
          cancelled,
          todayOrders, 
          todayRevenue, 
          readyForAdmin 
        });

        const byMonthMap = new Map();
        for (const o of list) {
          const d = new Date(o.createdAt);
          const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          byMonthMap.set(k, (byMonthMap.get(k)||0) + sumOrder(o));
        }
        const monthsArr = Array.from({length:6}).map((_,i)=>{
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          return { key: k, label: d.toLocaleDateString(undefined, { month:'short' }), value: byMonthMap.get(k)||0 };
        });
        setMonths(monthsArr);
        setLatestOrders([...list].sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5));
      } catch (error) {
        console.error('Dashboard: โหลดข้อมูลล้มเหลว', error);
        if (active) {
          setOrdersSummary({ 
            totalRevenue: 0, 
            pending: 0, 
            inProgress: 0, 
            readyToShip: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            todayOrders: 0, 
            todayRevenue: 0, 
            readyForAdmin: 0 
          });
          setMonths([]);
          setLatestOrders([]);
        }
      }
    })();
    return () => { active = false; };
  }, []);

  const maxVal = Math.max(1, ...months.map(m=> m.value));

  return (
    <Stack spacing={8}>
      <Box>
        <Heading size="lg" fontWeight="bold">ภาพรวมระบบ</Heading>
        <Text mt={2} color="gray.600" fontSize="md">
          ดูสรุปภาพรวมยอดขาย สินค้า และผู้ใช้งานในระบบ InventoryX
        </Text>
      </Box>

      {/* Today summary */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        {/* วันนี้: คำสั่งซื้อ / รายได้ / รอดำเนินการ */}
        <Stat
          bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)"
          borderRadius="2xl"
          boxShadow="lg"
          p={6}
          border="1px solid"
          borderColor="purple.200"
          color="white"
          transition="transform 0.2s"
          _hover={{ transform: 'translateY(-2px)' }}
        >
          <HStack justify="space-between" mb={3}>
            <StatLabel color="whiteAlpha.900" fontSize="sm" fontWeight="medium">คำสั่งซื้อวันนี้</StatLabel>
            <Icon as={ShoppingCart} color="whiteAlpha.800" boxSize={5} />
          </HStack>
          <StatNumber fontSize="3xl" fontWeight="bold">{ordersSummary.todayOrders}</StatNumber>
          <StatHelpText color="whiteAlpha.800" fontSize="sm">จำนวนออร์เดอร์ที่สร้างในวันนี้</StatHelpText>
        </Stat>
        <Stat
          bgGradient="linear(135deg, #f093fb 0%, #f5576c 100%)"
          borderRadius="2xl"
          boxShadow="lg"
          p={6}
          border="1px solid"
          borderColor="pink.200"
          color="white"
          transition="transform 0.2s"
          _hover={{ transform: 'translateY(-2px)' }}
        >
          <HStack justify="space-between" mb={3}>
            <StatLabel color="whiteAlpha.900" fontSize="sm" fontWeight="medium">รายได้วันนี้</StatLabel>
            <Icon as={DollarSign} color="whiteAlpha.800" boxSize={5} />
          </HStack>
          <StatNumber fontSize="3xl" fontWeight="bold">฿{ordersSummary.todayRevenue.toLocaleString()}</StatNumber>
          <StatHelpText color="whiteAlpha.800" fontSize="sm">เฉพาะคำสั่งซื้อที่บันทึกวันนี้</StatHelpText>
        </Stat>
        <Stat
          bgGradient="linear(135deg, #fa709a 0%, #fee140 100%)"
          borderRadius="2xl"
          boxShadow="lg"
          p={6}
          border="1px solid"
          borderColor="orange.200"
          color="white"
          transition="transform 0.2s"
          _hover={{ transform: 'translateY(-2px)' }}
        >
          <HStack justify="space-between" mb={3}>
            <StatLabel color="whiteAlpha.900" fontSize="sm" fontWeight="medium">รอยืนยันการส่ง</StatLabel>
            <Icon as={Clock3} color="whiteAlpha.800" boxSize={5} />
          </HStack>
          <StatNumber fontSize="3xl" fontWeight="bold">{ordersSummary.readyForAdmin}</StatNumber>
          <StatHelpText color="whiteAlpha.800" fontSize="sm">รอแอดมินยืนยันการส่ง</StatHelpText>
        </Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        {/* ภาพรวมทั้งหมด: ใช้สีคนละโทนกับแถวบน */}
        <Stat
          bgGradient="linear(135deg, #4facfe 0%, #00f2fe 100%)"
          borderRadius="2xl"
          boxShadow="lg"
          p={6}
          border="1px solid"
          borderColor="blue.200"
          color="white"
          transition="transform 0.2s"
          _hover={{ transform: 'translateY(-2px)' }}
        >
          <HStack justify="space-between" mb={3}>
            <StatLabel color="whiteAlpha.900" fontSize="sm" fontWeight="medium">รายได้รวม</StatLabel>
            <Icon as={BarChart3} color="whiteAlpha.800" boxSize={5} />
          </HStack>
          <StatNumber fontSize="3xl" fontWeight="bold">฿{ordersSummary.totalRevenue.toLocaleString()}</StatNumber>
          <StatHelpText color="whiteAlpha.800" fontSize="sm">รวมทุกคำสั่งซื้อทั้งหมด</StatHelpText>
        </Stat>
        <Stat
          bgGradient="linear(135deg, #a8edea 0%, #fed6e3 100%)"
          borderRadius="2xl"
          boxShadow="lg"
          p={6}
          border="1px solid"
          borderColor="pink.200"
          color="white"
          transition="transform 0.2s"
          _hover={{ transform: 'translateY(-2px)' }}
        >
          <HStack justify="space-between" mb={3}>
            <StatLabel color="whiteAlpha.900" fontSize="sm" fontWeight="medium">จำนวนสินค้า</StatLabel>
            <Icon as={Package} color="whiteAlpha.800" boxSize={5} />
          </HStack>
          <StatNumber fontSize="3xl" fontWeight="bold">{productsCount}</StatNumber>
          <StatHelpText color="whiteAlpha.800" fontSize="sm">จำนวนรายการสินค้าทั้งหมด</StatHelpText>
        </Stat>
        <Stat
          bgGradient="linear(135deg, #ffecd2 0%, #fcb69f 100%)"
          borderRadius="2xl"
          boxShadow="lg"
          p={6}
          border="1px solid"
          borderColor="orange.200"
          color="white"
          transition="transform 0.2s"
          _hover={{ transform: 'translateY(-2px)' }}
        >
          <HStack justify="space-between" mb={3}>
            <StatLabel color="whiteAlpha.900" fontSize="sm" fontWeight="medium">ผู้ใช้งาน</StatLabel>
            <Icon as={Users} color="whiteAlpha.800" boxSize={5} />
          </HStack>
          <StatNumber fontSize="3xl" fontWeight="bold">{userStats.total || userStats.count || 0}</StatNumber>
          <StatHelpText color="whiteAlpha.800" fontSize="sm">รวมทุกบทบาทในระบบ</StatHelpText>
        </Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Sales chart */}
        <Box
          bg="white"
          p={8}
          borderRadius="2xl"
          boxShadow="xl"
          border="1px solid"
          borderColor="gray.200"
          transition="all 0.3s"
          _hover={{ boxShadow: '2xl', borderColor: 'blue.300' }}
        >
          <HStack justify="space-between" mb={6}>
            <VStack align="flex-start" spacing={1}>
              <Heading size="md" fontWeight="bold" color="gray.800">ยอดขาย 6 เดือนล่าสุด</Heading>
              <Text fontSize="sm" color="gray.500">เปรียบเทียบยอดขายรายเดือน เพื่อดูแนวโน้มการเติบโต</Text>
            </VStack>
            <Icon as={BarChart3} color="blue.500" boxSize={6} />
          </HStack>
          <HStack align="end" spacing={3} h="200px">
            {months.map(m => (
              <VStack key={m.key} spacing={2} flex="1">
                <Box
                  w="100%"
                  bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)"
                  borderRadius="md"
                  height={`${(m.value / maxVal) * 140 + 10}px`}
                  transition="all 0.2s"
                  _hover={{ 
                    transform: 'translateY(-4px)',
                    boxShadow: 'lg'
                  }}
                />
                <Text fontSize="xs" color="gray.600" fontWeight="medium">{m.label}</Text>
              </VStack>
            ))}
          </HStack>
        </Box>

        {/* Latest notifications */}
        <Box
          bg="white"
          p={8}
          borderRadius="2xl"
          boxShadow="xl"
          border="1px solid"
          borderColor="gray.200"
          transition="all 0.3s"
          _hover={{ boxShadow: '2xl', borderColor: 'purple.300' }}
        >
          <HStack justify="space-between" mb={6}>
            <VStack align="flex-start" spacing={1}>
              <Heading size="md" fontWeight="bold" color="gray.800">การแจ้งเตือนล่าสุด</Heading>
              <Text fontSize="sm" color="gray.500">แสดง 5 การแจ้งเตือนล่าสุด</Text>
            </VStack>
            <HStack spacing={2}>
              <Icon as={Bell} color="purple.500" boxSize={6} />
            </HStack>
          </HStack>
          <Stack spacing={3}>
            {notifications.length === 0 && (
              <HStack justify="center" py={8} color="gray.400" spacing={3}>
                <Icon as={Bell} boxSize={5} />
                <Text fontSize="lg" fontWeight="medium">ยังไม่มีการแจ้งเตือน</Text>
              </HStack>
            )}
            {notifications.map((n, index) => (
              <HStack 
                key={n.id} 
                justify="space-between" 
                align="flex-start"
                p={4}
                bg="gray.50"
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.200"
                transition="all 0.2s"
                _hover={{ 
                  bg: "purple.100", 
                  borderColor: "purple.300",
                  transform: "translateX(4px)"
                }}
              >
                <HStack spacing={3}>
                  <Tag 
                    size="sm" 
                    colorScheme={
                      n.type === 'low_stock' ? 'red' : 
                      n.type === 'staff_activity' ? 'blue' : 
                      'gray'
                    }
                    borderRadius="full"
                    px={2}
                    py={1}
                  />
                  <VStack align="flex-start" spacing={0} minH="40px">
                    <Text noOfLines={1} fontSize="sm" fontWeight="medium" color="gray.800">
                      {n.title || (
                        n.type === 'low_stock' ? 'สินค้าใกล้หมด' :
                        n.type === 'staff_activity' ? 'พนักงานรับออเดอร์' :
                        'การแจ้งเตือน'
                      )}
                    </Text>
                    <Text noOfLines={2} fontSize="xs" color="gray.600">
                      {n.message}
                    </Text>
                    {index === 0 && (
                      <Text fontSize="xs" color="purple.600" fontWeight="medium">
                        ล่าสุด
                      </Text>
                    )}
                    {index !== 0 && (
                      <Box h="16px" />
                    )}
                  </VStack>
                </HStack>
                <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
                  {n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : ''}
                </Text>
              </HStack>
            ))}
          </Stack>
        </Box>
      </SimpleGrid>

      {/* Latest orders - full width */}
      <Box
        bg="white"
        p={8}
        borderRadius="2xl"
        boxShadow="xl"
        border="1px solid"
        borderColor="gray.200"
        transition="all 0.3s"
        _hover={{ boxShadow: '2xl', borderColor: 'teal.300' }}
      >
        <HStack justify="space-between" mb={6}>
          <VStack align="flex-start" spacing={1}>
            <Heading size="md" fontWeight="bold" color="gray.800">คำสั่งซื้อล่าสุด</Heading>
            <Text fontSize="sm" color="gray.500">5 คำสั่งซื้อล่าสุดที่เกิดขึ้นในระบบ (ดึงจาก API)</Text>
          </VStack>
          <Icon as={ShoppingCart} color="teal.500" boxSize={6} />
        </HStack>
        <Stack spacing={4}>
          {latestOrders.length === 0 && (
            <HStack justify="center" py={8} color="gray.400" spacing={3}>
              <Icon as={ShoppingCart} boxSize={5} />
              <Text fontSize="lg" fontWeight="medium">ยังไม่มีคำสั่งซื้อ</Text>
            </HStack>
          )}
          {latestOrders.map((o, index) => (
            <HStack 
              key={o.id} 
              justify="space-between" 
              align="center"
              p={4}
              bg="gray.50"
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.200"
              transition="all 0.2s"
              _hover={{ 
                bg: "teal.100", 
                borderColor: "teal.300",
                transform: "translateX(4px)"
              }}
            >
              <HStack spacing={3}>
                <Box
                  w={2}
                  h={2}
                  bg="gray.400"
                  borderRadius="full"
                />
                <VStack align="flex-start" spacing={0} minH="40px">
                  <Text fontWeight="medium" color="gray.800">
                    {o.orderNumber || o.id}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}
                  </Text>
                  {index === 0 && (
                    <Text fontSize="xs" color="teal.600" fontWeight="medium">
                      ล่าสุด
                    </Text>
                  )}
                  {index !== 0 && (
                    <Box h="16px" />
                  )}
                </VStack>
              </HStack>
              <Badge 
                colorScheme="gray"
                px={3}
                py={1}
                borderRadius="full"
                fontSize="xs"
                fontWeight="medium"
              >
                {o.status || 'PENDING'}
              </Badge>
            </HStack>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
