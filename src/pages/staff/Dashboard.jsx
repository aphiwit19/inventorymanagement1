import { useEffect, useState } from 'react';
import { Box, Heading, SimpleGrid, Stat, StatHelpText, StatLabel, StatNumber, Stack, HStack, Text, VStack, Icon, Badge, Spinner } from '@chakra-ui/react';
import { getCurrentUser } from '../../services/auth';
import { fetchStaffQueueOrders, fetchMyOrders } from '../../services/orders';
import { ClipboardList, Boxes, CheckSquare } from 'lucide-react';

export default function StaffDashboard() {
  const user = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [preparingCount, setPreparingCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [latestOrders, setLatestOrders] = useState([]);
  const [preparingOrders, setPreparingOrders] = useState([]);

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
    <Stack spacing={8}>
      <Box>
        <Heading size="lg" fontWeight="bold">ภาพรวมงาน</Heading>
        <Text mt={2} color="gray.600" fontSize="md">
          ดูสถานะคิวงานและคำสั่งซื้อล่าสุดสำหรับทีมจัดสินค้า
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
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
            <StatLabel color="whiteAlpha.900" fontSize="sm" fontWeight="medium">คิวรอจัด</StatLabel>
            <Icon as={ClipboardList} color="whiteAlpha.800" boxSize={5} />
          </HStack>
          <StatNumber fontSize="3xl" fontWeight="bold">{queueCount}</StatNumber>
          <StatHelpText color="whiteAlpha.800" fontSize="sm">คำสั่งซื้อที่ยังไม่มีพนักงานรับ</StatHelpText>
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
            <StatLabel color="whiteAlpha.900" fontSize="sm" fontWeight="medium">งานที่กำลังทำ</StatLabel>
            <Icon as={Boxes} color="whiteAlpha.800" boxSize={5} />
          </HStack>
          <StatNumber fontSize="3xl" fontWeight="bold">{preparingCount}</StatNumber>
          <StatHelpText color="whiteAlpha.800" fontSize="sm">ออร์เดอร์ที่คุณกำลังจัดอยู่</StatHelpText>
        </Stat>
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
            <StatLabel color="whiteAlpha.900" fontSize="sm" fontWeight="medium">จัดเสร็จแล้ว</StatLabel>
            <Icon as={CheckSquare} color="whiteAlpha.800" boxSize={5} />
          </HStack>
          <StatNumber fontSize="3xl" fontWeight="bold">{readyCount}</StatNumber>
          <StatHelpText color="whiteAlpha.800" fontSize="sm">รอแอดมินดำเนินการส่งต่อ</StatHelpText>
        </Stat>
      </SimpleGrid>

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
            <Heading size="md" fontWeight="bold" color="gray.800">คำสั่งซื้อรอจัดล่าสุด</Heading>
            <Text fontSize="sm" color="gray.500">แสดง 5 คำสั่งซื้อที่รอจัดล่าสุด</Text>
          </VStack>
          <Icon as={ClipboardList} color="blue.500" boxSize={6} />
        </HStack>
        
        <Stack spacing={4}>
          {latestOrders.map((o, index) => (
            <HStack 
              key={o.id} 
              justify="space-between"
              p={4}
              bg="gray.50"
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.200"
              transition="all 0.2s"
              _hover={{ 
                bg: "blue.100", 
                borderColor: "blue.300",
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
                  {index === 0 && (
                    <Text fontSize="xs" color="blue.600" fontWeight="medium">
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
                {new Date(o.createdAt || o.orderDate).toLocaleDateString()}
              </Badge>
            </HStack>
          ))}
          {latestOrders.length === 0 && (
            <HStack 
              justify="center" 
              py={8}
              color="gray.400"
              spacing={3}
            >
              <Icon as={ClipboardList} boxSize={5} />
              <Text fontSize="lg" fontWeight="medium">คิวว่าง</Text>
            </HStack>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
