import { useEffect, useState } from 'react';
import { Box, Heading, SimpleGrid, Stat, StatHelpText, StatLabel, StatNumber, Stack, HStack, Text, VStack, Icon, Badge, Spinner } from '@chakra-ui/react';
import { getCurrentUser } from '../../services/auth';
import { fetchStaffQueueOrders, fetchMyOrders } from '../../services/orders';
import { ClipboardList, Boxes, CheckSquare, AlertTriangle } from 'lucide-react';

export default function StaffDashboard() {
  const user = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [preparingCount, setPreparingCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [latestOrders, setLatestOrders] = useState([]);
  const [preparingOrders, setPreparingOrders] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // คิวรอจัด
        const queueOrders = await fetchStaffQueueOrders();
        setQueueCount(queueOrders.length);
        setLatestOrders(queueOrders.slice(0, 5));
        
        // กำลังจัด
        const preparingRes = await fetchMyOrders({ status: 'PREPARING', page: 1, limit: 5 });
        setPreparingCount(preparingRes.pagination?.total || 0);
        setPreparingOrders(preparingRes.orders || []);
        
        // จัดเสร็จแล้ว
        const readyRes = await fetchMyOrders({ status: 'READY_TO_SHIP', page: 1, limit: 1 });
        setReadyCount(readyRes.pagination?.total || 0);
        
        // แจ้งเตือนสต็อกต่ำ (mock data for now)
        setLowStockCount(0);
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <Stack spacing={6} align="center" py={10}>
        <Spinner size="xl" />
        <Text>กำลังโหลดข้อมูล...</Text>
      </Stack>
    );
  }

  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="lg">ภาพรวมงาน</Heading>
        <Text mt={1} color="gray.600" fontSize="sm">
          ดูสถานะคิวงานและสต็อกที่ต้องระวังสำหรับทีมจัดสินค้า
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Stat
          bgGradient="linear(to-br, blue.50, white)"
          borderRadius="xl"
          boxShadow="sm"
          p={5}
          border="1px solid"
          borderColor="blue.100"
        >
          <HStack justify="space-between" mb={2}>
            <StatLabel>คิวรอจัด</StatLabel>
            <Icon as={ClipboardList} color="blue.500" />
          </HStack>
          <StatNumber>{queueCount}</StatNumber>
          <StatHelpText>คำสั่งซื้อที่ยังไม่มีพนักงานรับ</StatHelpText>
        </Stat>
        <Stat
          bgGradient="linear(to-br, teal.50, white)"
          borderRadius="xl"
          boxShadow="sm"
          p={5}
          border="1px solid"
          borderColor="teal.100"
        >
          <HStack justify="space-between" mb={2}>
            <StatLabel>งานที่กำลังทำ</StatLabel>
            <Icon as={Boxes} color="teal.500" />
          </HStack>
          <StatNumber>{preparingCount}</StatNumber>
          <StatHelpText>ออร์เดอร์ที่คุณกำลังจัดอยู่</StatHelpText>
        </Stat>
        <Stat
          bgGradient="linear(to-br, green.50, white)"
          borderRadius="xl"
          boxShadow="sm"
          p={5}
          border="1px solid"
          borderColor="green.100"
        >
          <HStack justify="space-between" mb={2}>
            <StatLabel>จัดเสร็จแล้ว</StatLabel>
            <Icon as={CheckSquare} color="green.500" />
          </HStack>
          <StatNumber>{readyCount}</StatNumber>
          <StatHelpText>รอแอดมินดำเนินการส่งต่อ</StatHelpText>
        </Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" borderTopWidth={3} borderTopColor="blue.400" minH="220px">
          <HStack justify="space-between" mb={1}>
            <Heading size="sm">คำสั่งซื้อรอจัดล่าสุด</Heading>
            <Icon as={ClipboardList} color="blue.500" />
          </HStack>
          <Text fontSize="xs" color="gray.500" mb={3}>
            แสดง 5 คำสั่งซื้อที่รอจัดล่าสุด
          </Text>
          <Stack spacing={3}>
            {latestOrders.map(o => (
              <HStack key={o.id} justify="space-between">
                <Text noOfLines={1}>{o.orderNumber || o.id}</Text>
                <Badge colorScheme="blue">{new Date(o.createdAt || o.orderDate).toLocaleDateString()}</Badge>
              </HStack>
            ))}
            {latestOrders.length === 0 && (
              <HStack color="gray.500">
                <Icon as={ClipboardList} />
                <Text>คิวว่าง</Text>
              </HStack>
            )}
          </Stack>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" borderTopWidth={3} borderTopColor="red.400" minH="220px">
          <HStack justify="space-between" mb={1}>
            <Heading size="sm">แจ้งเตือนสต็อกต่ำ</Heading>
            <Icon as={AlertTriangle} color="red.400" />
          </HStack>
          <Text fontSize="xs" color="gray.500" mb={3}>
            สินค้าที่สต็อกต่ำกว่า 20% ของจำนวนเริ่มต้น
          </Text>
          <Stack spacing={2}>
            {lowStockCount > 0 ? (
              <Text color="gray.500">พบ {lowStockCount} รายการสินค้าที่สต็อกต่ำ</Text>
            ) : (
              <Text color="gray.500">ยังไม่มีสินค้าที่สต็อกต่ำกว่า 20%</Text>
            )}
          </Stack>
        </Box>
      </SimpleGrid>

      <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" borderTopWidth={3} borderTopColor="teal.400" minH="220px">
        <HStack justify="space-between" mb={1}>
          <Heading size="sm">งานที่กำลังทำ</Heading>
          <Icon as={Boxes} color="teal.500" />
        </HStack>
        <Text fontSize="xs" color="gray.500" mb={3}>
          งานที่คุณรับไว้และยังจัดไม่เสร็จ
        </Text>
        <Stack spacing={3}>
          {preparingOrders.map(o => (
            <HStack key={o.id} justify="space-between">
              <Text noOfLines={1}>{o.orderNumber || o.id}</Text>
              <Text color="gray.600">เริ่ม {new Date(o.updatedAt || o.createdAt || o.orderDate).toLocaleString()}</Text>
            </HStack>
          ))}
          {preparingOrders.length === 0 && <Text color="gray.500">ยังไม่มีงานที่กำลังทำ</Text>}
        </Stack>
      </Box>
    </Stack>
  );
}
