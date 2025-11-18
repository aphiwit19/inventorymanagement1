import { useMemo } from 'react';
import { Box, Heading, SimpleGrid, Stat, StatHelpText, StatLabel, StatNumber, Stack, HStack, Text, VStack, Icon, Badge } from '@chakra-ui/react';
import { getCurrentUser } from '../../services/auth';
import { listUnassignedOrders, listOrdersByStaff } from '../../services/orders';
import { listProducts } from '../../services/products';
import { ClipboardList, Boxes, CheckSquare } from 'lucide-react';

export default function StaffDashboard() {
  const user = getCurrentUser();
  const queue = useMemo(()=> listUnassignedOrders(), []);
  const myOrders = useMemo(()=> listOrdersByStaff(user?.id || ''), [user?.id]);
  const products = useMemo(()=> listProducts(), []);

  const preparing = myOrders.filter(o => o.assignedStaffId === user?.id && !o.staffPrepared);
  const prepared = myOrders.filter(o => o.assignedStaffId === user?.id && o.staffPrepared);
  // ใช้เกณฑ์เดียวกับฝั่งแอดมิน: สต็อกต่ำกว่า 20% ของ initialStock
  const lowStock = products.filter((p) => {
    const initial = Number(p.initialStock || 0);
    if (!initial) return false;
    const threshold = initial * 0.2;
    return Number(p.stock || 0) <= threshold;
  });

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
          <StatNumber>{queue.length}</StatNumber>
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
          <StatNumber>{preparing.length}</StatNumber>
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
          <StatNumber>{prepared.length}</StatNumber>
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
            {queue.slice(0,5).map(o => (
              <HStack key={o.id} justify="space-between">
                <Text noOfLines={1}>{o.id}</Text>
                <Badge colorScheme="blue">{new Date(o.createdAt).toLocaleDateString()}</Badge>
              </HStack>
            ))}
            {queue.length === 0 && (
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
            <Icon as={Boxes} color="red.400" />
          </HStack>
          <Text fontSize="xs" color="gray.500" mb={3}>
            สินค้าที่สต็อกต่ำกว่า 20% ของจำนวนเริ่มต้น
          </Text>
          <Stack spacing={2}>
            {lowStock.slice(0,8).map(p => (
              <HStack key={p.id} justify="space-between">
                <Text noOfLines={1}>{p.sku} - {p.name}</Text>
                <Text color="red.600">{p.stock}</Text>
              </HStack>
            ))}
            {lowStock.length === 0 && (
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
          {preparing.slice(0,5).map(o => (
            <HStack key={o.id} justify="space-between">
              <Text noOfLines={1}>{o.id}</Text>
              <Text color="gray.600">เริ่ม {new Date(o.updatedAt||o.createdAt).toLocaleString()}</Text>
            </HStack>
          ))}
          {preparing.length === 0 && <Text color="gray.500">ยังไม่มีงานที่กำลังทำ</Text>}
        </Stack>
      </Box>
    </Stack>
  );
}
