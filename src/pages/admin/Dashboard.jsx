import { useEffect, useState } from 'react';
import { Box, Heading, SimpleGrid, Stat, StatHelpText, StatLabel, StatNumber, Stack, HStack, Text, VStack, Tag, Icon } from '@chakra-ui/react';
import { fetchMyOrders } from '../../services/orders';
import { fetchAdminProductsPaged, getLowStock } from '../../services/products';
import { getUserStats } from '../../services/users';
import { getNotifications, getUnreadCount } from '../../services/notifications';
import { ShoppingCart, DollarSign, Clock3, Package, Users, BarChart3, Bell } from 'lucide-react';

export default function Dashboard() {
  const [productsCount, setProductsCount] = useState(0);
  const [userStats, setUserStats] = useState({});
  const [ordersSummary, setOrdersSummary] = useState({ totalRevenue: 0, pending: 0, inProgress: 0, shipped: 0, todayOrders: 0, todayRevenue: 0, todayPending: 0 });
  const [months, setMonths] = useState([]);
  const [latestOrders, setLatestOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Products count via paged API (page 1 only)
        const [{ products, pagination }] = await Promise.all([
          fetchAdminProductsPaged({ page: 1, limit: 1 }),
        ]);
        if (!active) return;
        setProductsCount((pagination && pagination.total) || products.length || 0);
      } catch {
        if (active) setProductsCount(0);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [statsRes, notiList, notiUnread, lowStockList] = await Promise.all([
          getUserStats().catch(()=> ({})),
          getNotifications().catch(()=> []),
          getUnreadCount().catch(()=> 0),
          getLowStock().catch(()=> []),
        ]);

        if (!active) return;
        setUserStats(statsRes || {});
        setNotifications(Array.isArray(notiList) ? notiList.slice(0, 5) : []);
        setUnread(Number(notiUnread || 0));
        setLowStock(Array.isArray(lowStockList) ? lowStockList.slice(0, 5) : []);
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Fetch recent orders and compute simple summaries on client as fallback
        const { orders } = await fetchMyOrders({ page: 1, limit: 20 });
        if (!active) return;
        const list = Array.isArray(orders) ? orders : [];
        const today = new Date();
        const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
        const sumOrder = (o) => (o.items||[]).reduce((s,i)=> s + Number(i.price||i.unitPrice||0) * Number(i.qty||i.quantity||0), 0);
        const totalRevenue = list.reduce((s,o)=> s + sumOrder(o), 0);
        const pending = list.filter(o=> o.status === 'pending').length;
        const inProgress = list.filter(o=> o.status === 'in_progress').length;
        const shipped = list.filter(o=> o.status === 'shipped' || o.status === 'delivered').length;
        const todayOrders = list.filter(o=> isSameDay(new Date(o.createdAt), today)).length;
        const todayRevenue = list.filter(o=> isSameDay(new Date(o.createdAt), today)).reduce((s,o)=> s + sumOrder(o), 0);
        const todayPending = list.filter(o=> isSameDay(new Date(o.createdAt), today) && o.status === 'pending').length;
        setOrdersSummary({ totalRevenue, pending, inProgress, shipped, todayOrders, todayRevenue, todayPending });

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
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, []);

  const maxVal = Math.max(1, ...months.map(m=> m.value));

  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="lg">ภาพรวมระบบ</Heading>
        <Text mt={1} color="gray.600" fontSize="sm">
          ดูสรุปภาพรวมยอดขาย สินค้า และผู้ใช้งานในระบบ InventoryX
        </Text>
      </Box>

      {/* Today summary */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {/* วันนี้: คำสั่งซื้อ / รายได้ / รอดำเนินการ */}
        <Stat
          bgGradient="linear(to-br, blue.50, white)"
          borderRadius="xl"
          boxShadow="sm"
          p={4}
          border="1px solid"
          borderColor="blue.100"
        >
          <HStack justify="space-between" mb={1}>
            <StatLabel color="gray.600">คำสั่งซื้อวันนี้</StatLabel>
            <Icon as={ShoppingCart} color="blue.500" boxSize={5} />
          </HStack>
          <StatNumber mt={1} color="blue.700">{ordersSummary.todayOrders}</StatNumber>
          <StatHelpText>จำนวนออร์เดอร์ที่สร้างในวันนี้</StatHelpText>
        </Stat>
        <Stat
          bgGradient="linear(to-br, green.50, white)"
          borderRadius="xl"
          boxShadow="sm"
          p={4}
          border="1px solid"
          borderColor="green.100"
        >
          <HStack justify="space-between" mb={1}>
            <StatLabel color="gray.600">รายได้วันนี้</StatLabel>
            <Icon as={DollarSign} color="green.500" boxSize={5} />
          </HStack>
          <StatNumber mt={1} color="green.600">฿{ordersSummary.todayRevenue.toLocaleString()}</StatNumber>
          <StatHelpText>เฉพาะคำสั่งซื้อที่บันทึกวันนี้</StatHelpText>
        </Stat>
        <Stat
          bgGradient="linear(to-br, orange.50, white)"
          borderRadius="xl"
          boxShadow="sm"
          p={4}
          border="1px solid"
          borderColor="orange.100"
        >
          <HStack justify="space-between" mb={1}>
            <StatLabel color="gray.600">คำสั่งซื้อที่รอดำเนินการวันนี้</StatLabel>
            <Icon as={Clock3} color="orange.500" boxSize={5} />
          </HStack>
          <StatNumber mt={1}>{ordersSummary.todayPending}</StatNumber>
          <StatHelpText>สถานะยังไม่ดำเนินการ</StatHelpText>
        </Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        {/* ภาพรวมทั้งหมด: ใช้สีคนละโทนกับแถวบน */}
        <Stat
          bgGradient="linear(to-br, cyan.50, white)"
          borderRadius="xl"
          boxShadow="sm"
          p={5}
          border="1px solid"
          borderColor="cyan.100"
        >
          <HStack justify="space-between" mb={1}>
            <StatLabel color="gray.600">รายได้รวม</StatLabel>
            <Icon as={BarChart3} color="cyan.600" boxSize={5} />
          </HStack>
          <StatNumber mt={1} color="cyan.700">฿{ordersSummary.totalRevenue.toLocaleString()}</StatNumber>
          <StatHelpText>รวมทุกคำสั่งซื้อทั้งหมด</StatHelpText>
        </Stat>
        <Stat
          bgGradient="linear(to-br, pink.50, white)"
          borderRadius="xl"
          boxShadow="sm"
          p={5}
          border="1px solid"
          borderColor="pink.100"
        >
          <HStack justify="space-between" mb={1}>
            <StatLabel color="gray.600">จำนวนสินค้า</StatLabel>
            <Icon as={Package} color="pink.500" boxSize={5} />
          </HStack>
          <StatNumber mt={1} color="pink.700">{productsCount}</StatNumber>
          <StatHelpText>จำนวนรายการสินค้าทั้งหมด</StatHelpText>
        </Stat>
        <Stat
          bgGradient="linear(to-br, indigo.50, white)"
          borderRadius="xl"
          boxShadow="sm"
          p={5}
          border="1px solid"
          borderColor="indigo.100"
        >
          <HStack justify="space-between" mb={1}>
            <StatLabel color="gray.600">ผู้ใช้งาน</StatLabel>
            <Icon as={Users} color="indigo.600" boxSize={5} />
          </HStack>
          <StatNumber mt={1} color="indigo.700">{userStats.total || userStats.count || 0}</StatNumber>
          <StatHelpText>รวมทุกบทบาทในระบบ</StatHelpText>
        </Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Sales chart */}
        <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" borderTopWidth={3} borderTopColor="blue.400" minH="220px">
          <HStack justify="space-between" mb={1}>
            <Heading size="sm">ยอดขาย 6 เดือนล่าสุด</Heading>
            <Icon as={BarChart3} color="blue.500" boxSize={5} />
          </HStack>
          <Text fontSize="xs" color="gray.500" mb={4}>
            เปรียบเทียบยอดขายรายเดือน เพื่อดูแนวโน้มการเติบโต
          </Text>
          <HStack align="end" spacing={3} h="180px">
            {months.map(m => (
              <VStack key={m.key} spacing={2} flex="1">
                <Box
                  w="100%"
                  bg="blue.500"
                  borderRadius="md"
                  height={`${(m.value / maxVal) * 120 + 10}px`}
                />
                <Text fontSize="xs" color="gray.600">{m.label}</Text>
              </VStack>
            ))}
          </HStack>
        </Box>

        {/* Latest notifications */}
        <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" borderTopWidth={3} borderTopColor="purple.400" minH="220px">
          <HStack justify="space-between" mb={1}>
            <Heading size="sm">การแจ้งเตือนล่าสุด</Heading>
            <Icon as={Bell} color="purple.500" boxSize={5} />
          </HStack>
          <Text fontSize="xs" color="gray.500" mb={3}>
            แสดง 5 การแจ้งเตือนล่าสุด (ยังไม่ได้อ่าน {unread})
          </Text>
          <Stack spacing={3}>
            {notifications.length === 0 && (
              <Text color="gray.500">ยังไม่มีการแจ้งเตือน</Text>
            )}
            {notifications.map(n => (
              <HStack key={n.id} justify="space-between" align="flex-start">
                <HStack spacing={2} maxW="70%">
                  <Tag size="sm" colorScheme={n.type === 'low_stock' ? 'red' : 'blue'} />
                  <VStack align="flex-start" spacing={0}>
                    <Text noOfLines={1} fontSize="sm" fontWeight="medium">{n.title || n.type}</Text>
                    <Text noOfLines={1} fontSize="xs" color="gray.500">{n.message}</Text>
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
      <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" borderTopWidth={3} borderTopColor="teal.400" minH="220px">
        <HStack justify="space-between" mb={1}>
          <Heading size="sm">คำสั่งซื้อล่าสุด</Heading>
          <Icon as={ShoppingCart} color="teal.500" boxSize={5} />
        </HStack>
        <Text fontSize="xs" color="gray.500" mb={4}>
          5 คำสั่งซื้อล่าสุดที่เกิดขึ้นในระบบ (ดึงจาก API)
        </Text>
        <Stack spacing={3}>
          {latestOrders.length === 0 && (
            <Text color="gray.500">ยังไม่มีคำสั่งซื้อ</Text>
          )}
          {latestOrders.map(o => (
            <HStack key={o.id} justify="space-between" align="center">
              <VStack align="flex-start" spacing={0} maxW="70%">
                <Text noOfLines={1} fontWeight="medium">{o.id}</Text>
                <Text fontSize="xs" color="gray.500">
                  {o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}
                </Text>
              </VStack>
              <Text fontWeight="bold" color="gray.800">
                ฿{((o.items||[]).reduce((s, i) => s + Number(i.price||i.unitPrice||0) * Number(i.qty||i.quantity||0), 0)).toLocaleString()}
              </Text>
            </HStack>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
