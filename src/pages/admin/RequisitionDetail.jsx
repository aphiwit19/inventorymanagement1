import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Heading, Stack, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer, HStack, Tag, Select, Input, Badge, Button, Link, useToast } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { fetchOrderById, addTracking, confirmDelivery } from '../../services/orders';
import { getProductById } from '../../services/products';

export default function AdminRequisitionDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

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

  const items = order?.orderItems || [];
  const total = items.reduce((s, i) => s + Number(i.subtotal || (i.priceAtOrder || 0) * (i.quantity || 0)), 0);

  const tStatus = (s) => {
    switch (s) {
      case 'READY_TO_SHIP': return 'รอดำเนินการ';
      case 'SHIPPED': return 'ดำเนินการส่ง';
      case 'DELIVERED': return 'ส่งสำเร็จ';
      default: return s || 'รอดำเนินการ';
    }
  };

  // Draft state
  const [carrier, setCarrier] = useState(order?.shippingCompany || order?.shippingCarrier || '');
  const [tracking, setTracking] = useState(order?.trackingNumber || '');
  const dirty = !!order && ((carrier !== (order.shippingCompany || order.shippingCarrier || '')) || (tracking !== (order.trackingNumber || '')));
  const canSave = dirty && carrier && tracking;

  const onSave = async () => {
    if (!order) return;
    try {
      if (tracking && tracking !== (order.trackingNumber || '')) {
        await addTracking(order.id, { trackingNumber: tracking, shippingCompany: carrier });
        toast({ title: 'บันทึกแล้ว', status: 'success' });
        // Reload order data
        const data = await fetchOrderById(id);
        setOrder(data);
      }
    } catch (e) {
      toast({ title: e.message || 'บันทึกไม่สำเร็จ', status: 'error' });
    }
  };

  if (loading) {
    return (
      <Stack spacing={4}>
        <Heading size="lg">กำลังโหลดรายการเบิก...</Heading>
        <Text color="gray.600">กรุณารอสักครู่</Text>
      </Stack>
    );
  }

  if (error || !order) {
    return (
      <Stack spacing={4}>
        <Heading size="lg">ไม่พบรายการเบิก</Heading>
        <Text color="gray.600">{error || 'รหัสรายการเบิกไม่ถูกต้อง'}</Text>
      </Stack>
    );
  }

  const addr = order.shippingAddress || {};

  return (
    <Stack spacing={6}>
      <Heading size="lg">รายการเบิก #{order.orderNumber || order.id}</Heading>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
        <HStack justify="space-between" mb={3} align="flex-start">
          <Stack spacing={1}>
            <Text>พนักงานจัด: {order.staff?.fullName || order.staffName || '-'}</Text>
            <Text>ลูกค้า: {addr.recipientName || order.customer?.fullName || order.customerName || order.customerId}</Text>
          </Stack>
        </HStack>
        <Text color="gray.600">วันที่: {new Date(order.createdAt).toLocaleDateString()}</Text>
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
              {items.map((it, idx) => (
                <Tr key={idx}>
                  <Td>{it.product?.productName || it.productName || it.productId}</Td>
                  <Td isNumeric>฿{Number(it.priceAtOrder || 0).toLocaleString()}</Td>
                  <Td isNumeric>{it.quantity}</Td>
                  <Td isNumeric>฿{Number(it.subtotal || (it.priceAtOrder || 0) * (it.quantity || 0)).toLocaleString()}</Td>
                </Tr>
              ))}
              <Tr>
                <Th colSpan={3} textAlign="right">ยอดรวม</Th>
                <Th isNumeric>฿{Number(total).toLocaleString()}</Th>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
        <Heading size="sm" mb={3}>ที่อยู่จัดส่ง</Heading>
        <Stack spacing={1}>
          <Text>{addr.recipientName || order.customer?.fullName || order.customerName}</Text>
          <Text>{order.customerPhone || addr.phoneNumber}</Text>
          <Text>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</Text>
          <Text>{addr.subDistrict} {addr.district} {addr.province} {addr.postalCode}</Text>
        </Stack>
      </Box>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
        <Heading size="sm" mb={3}>การจัดส่ง</Heading>
        <HStack spacing={3} align="center">
          <Select size="sm" placeholder="เลือกขนส่ง" value={carrier} onChange={(e) => setCarrier(e.target.value)} maxW="48">
            <option value="EMS">EMS</option>
            <option value="ไปรษณีย์ไทย">ไปรษณีย์ไทย</option>
            <option value="Kerry">Kerry</option>
            <option value="J&T">J&T</option>
            <option value="Flash">Flash</option>
          </Select>
          <Input size="sm" placeholder="Tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} maxW="56" />
          <Button colorScheme="blue" size="sm" onClick={onSave} isDisabled={!canSave}>บันทึก</Button>
        </HStack>
      </Box>
    </Stack>
  );
}
