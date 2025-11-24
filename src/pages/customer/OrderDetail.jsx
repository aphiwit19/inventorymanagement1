import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Divider, Heading, HStack, SimpleGrid, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Tag, Text, useToast } from '@chakra-ui/react';
import { fetchOrderById } from '../../services/orders';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchOrderById(id);
        if (!active) return;
        setOrder(data);
      } catch (e) {
        if (!active) return;
        const msg = e.message || 'โหลดคำสั่งซื้อไม่สำเร็จ';
        setError(msg);
        toast({ title: msg, status: 'error' });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, toast]);

  const items = useMemo(() => {
    const src = order?.orderItems || [];
    return src.map(it => {
      const price = Number(it.priceAtOrder || 0);
      const qty = Number(it.quantity || 0);
      const subtotal = Number(it.subtotal != null ? it.subtotal : price * qty);
      return {
        id: it.id,
        productId: it.productId,
        name: it.productName || `สินค้า ${it.productId}`,
        price,
        qty,
        subtotal,
      };
    });
  }, [order]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
    const shipping = 0;
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  }, [items]);

  const statusLabel = (() => {
    const s = order?.status;
    switch (s) {
      case 'PENDING_CONFIRMATION': return 'รอยืนยัน';
      case 'PREPARING': return 'กำลังจัดเตรียม';
      case 'READY_TO_SHIP': return 'รอส่ง';
      case 'SHIPPED': return 'จัดส่งแล้ว';
      case 'DELIVERED': return 'ส่งสำเร็จ';
      case 'CANCELLED': return 'ยกเลิกแล้ว';
      default: return s || '';
    }
  })();

  const statusColor = (() => {
    const s = order?.status;
    switch (s) {
      case 'PENDING_CONFIRMATION': return 'yellow';
      case 'PREPARING':
      case 'READY_TO_SHIP': return 'blue';
      case 'SHIPPED':
      case 'DELIVERED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  })();

  if (loading) {
    return (
      <Stack spacing={4}>
        <Heading size="lg">กำลังโหลดคำสั่งซื้อ...</Heading>
        <Text color="gray.600">กรุณารอสักครู่</Text>
      </Stack>
    );
  }

  if (error || !order) {
    return (
      <Stack spacing={4}>
        <Heading size="lg">ไม่พบคำสั่งซื้อ</Heading>
        <Text color="gray.600">{error || 'รหัสออร์เดอร์ไม่ถูกต้อง หรือถูกลบไปแล้ว'}</Text>
        <Button onClick={()=> navigate('/orders')} colorScheme="blue" alignSelf="start">กลับไปคำสั่งซื้อของฉัน</Button>
      </Stack>
    );
  }

  const addr = order.shippingAddress || {};
  const phone = order.customerPhone || addr.phoneNumber || addr.phone;

  return (
    <Stack spacing={6}>
      <HStack justify="space-between">
        <Heading size="lg">คำสั่งซื้อ #{order.orderNumber || order.id}</Heading>
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
                {items.map((it)=> (
                  <Tr key={it.id || it.productId}>
                    <Td>{it.name}</Td>
                    <Td isNumeric>{it.qty}</Td>
                    <Td isNumeric>฿{it.price.toLocaleString()}</Td>
                    <Td isNumeric>฿{it.subtotal.toLocaleString()}</Td>
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
                <Text>{addr.recipientName}</Text>
                <Text color="gray.700">{addr.addressLine1}</Text>
                <Text color="gray.700">{addr.subDistrict} {addr.district} {addr.province} {addr.postalCode}</Text>
                <Text color="gray.600">{phone}</Text>
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
