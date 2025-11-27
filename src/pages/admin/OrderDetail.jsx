import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Heading, Stack, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer, HStack, Tag, useToast, Button } from '@chakra-ui/react';
import { fetchOrderById } from '../../services/orders';

export default function AdminOrderDetail() {
  const { id } = useParams();
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
        name: it.productName || it.product?.name || it.productId,
        price,
        qty,
        subtotal,
      };
    });
  }, [order]);

  const total = useMemo(() => items.reduce((s, i) => s + i.subtotal, 0), [items]);

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
        <Heading size="lg">ไม่พบบันทึกคำสั่งซื้อ</Heading>
        <Text color="gray.600">{error || 'รหัสคำสั่งซื้อไม่ถูกต้อง หรือถูกลบไปแล้ว'}</Text>
      </Stack>
    );
  }

  const addr = order.shippingAddress || {};
  const phone = order.customerPhone || addr.phoneNumber || addr.phone;

  return (
    <Stack spacing={6}>
      <Heading size="lg">คำสั่งซื้อ #{order.orderNumber || order.id}</Heading>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
        <HStack justify="space-between" mb={2}>
          <Text>สถานะปัจจุบัน:</Text>
          <Tag colorScheme={statusColor}>{statusLabel}</Tag>
        </HStack>
        <Text color="gray.600">วันที่: {new Date(order.createdAt).toLocaleString()}</Text>
      </Box>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
        <Heading size="sm" mb={3}>รายการสินค้า</Heading>
        <TableContainer>
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>สินค้า</Th>
                <Th isNumeric>ราคา</Th>
                <Th isNumeric>จำนวน</Th>
                <Th isNumeric>รวม</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((it)=> (
                <Tr key={it.id || it.productId}>
                  <Td>{it.name}</Td>
                  <Td isNumeric>฿{it.price.toLocaleString()}</Td>
                  <Td isNumeric>{it.qty}</Td>
                  <Td isNumeric>฿{it.subtotal.toLocaleString()}</Td>
                </Tr>
              ))}
              <Tr>
                <Th colSpan={3} textAlign="right">ยอดรวม</Th>
                <Th isNumeric>฿{total.toLocaleString()}</Th>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
        <Heading size="sm" mb={3}>ข้อมูลการจัดส่ง</Heading>
        {(order.shippingCompany || order.trackingNumber) ? (
          <Stack spacing={2}>
            {order.shippingCompany && (
              <HStack>
                <Text color="gray.600" minW="80px">ขนส่ง:</Text>
                <Text fontWeight="medium">{order.shippingCompany}</Text>
              </HStack>
            )}
            {order.trackingNumber && (
              <HStack>
                <Text color="gray.600" minW="80px">เลขพัสดุ:</Text>
                <Text fontWeight="medium" color="blue.600">{order.trackingNumber}</Text>
              </HStack>
            )}
          </Stack>
        ) : (
          <Text color="gray.500">ยังไม่มีข้อมูลการจัดส่ง</Text>
        )}
      </Box>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
        <Heading size="sm" mb={3}>ที่อยู่จัดส่ง</Heading>
        {order.shippingAddress ? (
          <Stack spacing={1}>
            <Text>{addr.recipientName}</Text>
            <Text>{phone}</Text>
            <Text>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}`:''}</Text>
            <Text>{addr.subDistrict} {addr.district} {addr.province} {addr.postalCode}</Text>
          </Stack>
        ) : (
          <Text color="gray.600">- ไม่มีข้อมูล -</Text>
        )}
      </Box>
    </Stack>
  );
}
