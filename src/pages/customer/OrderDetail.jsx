import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Divider, Heading, HStack, SimpleGrid, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Tag, Text } from '@chakra-ui/react';
import { getOrderById } from '../../services/orders';
import { getCurrentUser } from '../../services/auth';
import { getProductById } from '../../services/products';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const order = useMemo(()=> getOrderById(id), [id]);

  const items = useMemo(()=> {
    if (!order) return [];
    return order.items.map(it => {
      const p = getProductById(it.productId);
      return { ...it, name: p?.name || `สินค้า ${it.productId}` };
    });
  }, [order]);

  const totals = useMemo(()=> {
    const subtotal = items.reduce((sum, it)=> sum + it.price * it.qty, 0);
    const shipping = 0; // local demo
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  }, [items]);

  const unauthorized = user && order && order.customerId !== user.id;

  const statusLabel = order?.status === 'pending'
    ? 'รอดำเนินการ'
    : order?.status === 'in_progress'
      ? 'กำลังดำเนินการส่ง'
      : order?.status === 'shipped'
        ? 'ส่งสำเร็จ'
        : order?.status || '';

  const statusColor = order?.status === 'pending'
    ? 'yellow'
    : order?.status === 'in_progress'
      ? 'blue'
      : order?.status === 'shipped'
        ? 'green'
        : 'gray';

  if (!order) {
    return (
      <Stack spacing={4}>
        <Heading size="lg">ไม่พบคำสั่งซื้อ</Heading>
        <Text color="gray.600">รหัสออร์เดอร์ไม่ถูกต้อง หรือถูกลบไปแล้ว</Text>
        <Button onClick={()=> navigate('/orders')} colorScheme="blue" alignSelf="start">กลับไปคำสั่งซื้อของฉัน</Button>
      </Stack>
    );
  }

  if (unauthorized) {
    return (
      <Stack spacing={4}>
        <Heading size="lg">ไม่สามารถเข้าถึงได้</Heading>
        <Text color="gray.600">คุณไม่มีสิทธิ์ดูคำสั่งซื้อนี้</Text>
        <Button onClick={()=> navigate('/orders')} colorScheme="blue" alignSelf="start">กลับไปคำสั่งซื้อของฉัน</Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={6}>
      <HStack justify="space-between">
        <Heading size="lg">คำสั่งซื้อ #{order.id}</Heading>
        <Tag size="lg" colorScheme={statusColor}>{statusLabel}</Tag>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
          <Heading size="md" mb={3}>สินค้า</Heading>
          <TableContainer>
            <Table size="md">
              <Thead>
                <Tr>
                  <Th>สินค้า</Th>
                  <Th isNumeric>จำนวน</Th>
                  <Th isNumeric>ราคา/ชิ้น</Th>
                  <Th isNumeric>รวม</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map((it, idx)=> (
                  <Tr key={idx}>
                    <Td>{it.name}</Td>
                    <Td isNumeric>{it.qty}</Td>
                    <Td isNumeric>฿{it.price.toLocaleString()}</Td>
                    <Td isNumeric>฿{(it.price * it.qty).toLocaleString()}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Stack spacing={4}>
          <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
            <Heading size="md" mb={3}>สรุปคำสั่งซื้อ</Heading>
            <Stack spacing={2}>
              <HStack justify="space-between">
                <Text color="gray.600">ยอดรวมสินค้า</Text>
                <Text>฿{totals.subtotal.toLocaleString()}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="gray.600">ค่าจัดส่ง</Text>
                <Text>฿{totals.shipping.toLocaleString()}</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between" fontWeight="bold">
                <Text>ยอดสุทธิ</Text>
                <Text>฿{totals.total.toLocaleString()}</Text>
              </HStack>
            </Stack>
          </Box>

          <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
            <Heading size="md" mb={3}>ที่อยู่จัดส่ง</Heading>
            {order.shippingAddress ? (
              <Stack spacing={1}>
                <Text>{order.shippingAddress.fullName}</Text>
                <Text color="gray.700">{order.shippingAddress.line1}</Text>
                <Text color="gray.700">{order.shippingAddress.district} {order.shippingAddress.province} {order.shippingAddress.zipcode}</Text>
                <Text color="gray.600">{order.shippingAddress.phone}</Text>
              </Stack>
            ) : (
              <Text color="gray.600">- ไม่มีข้อมูล -</Text>
            )}
          </Box>

          <HStack>
            <Button variant="outline" onClick={()=> navigate('/orders')}>ย้อนกลับ</Button>
            <Button colorScheme="blue" onClick={()=> navigate('/products')}>เลือกซื้อสินค้าเพิ่ม</Button>
          </HStack>
        </Stack>
      </SimpleGrid>

      <Box>
        <Text color="gray.600">อัปเดตล่าสุด: {new Date(order.updatedAt || order.createdAt).toLocaleString()}</Text>
      </Box>
    </Stack>
  );
}
