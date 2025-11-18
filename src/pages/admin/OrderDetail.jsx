import { useParams } from 'react-router-dom';
import { Box, Heading, Stack, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer, HStack, Tag } from '@chakra-ui/react';
import { getOrderById } from '../../services/orders';
import { getProductById } from '../../services/products';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const order = getOrderById(id);
  if (!order) return <Text>ไม่พบบันทึกคำสั่งซื้อ</Text>;

  const total = order.items.reduce((s,i)=> s + i.price*i.qty, 0);
  const statusLabel = order.status === 'pending' ? 'รอดำเนินการ' : order.status === 'in_progress' ? 'กำลังดำเนินการส่ง' : 'ส่งสำเร็จ';
  const statusColor = order.status === 'pending' ? 'yellow' : order.status === 'in_progress' ? 'blue' : 'green';

  return (
    <Stack spacing={6}>
      <Heading size="lg">คำสั่งซื้อ #{order.id}</Heading>

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
              {order.items.map((it, idx)=> {
                const p = getProductById(it.productId);
                return (
                  <Tr key={idx}>
                    <Td>{p?.name || it.productId}</Td>
                    <Td isNumeric>฿{it.price.toLocaleString()}</Td>
                    <Td isNumeric>{it.qty}</Td>
                    <Td isNumeric>฿{(it.price*it.qty).toLocaleString()}</Td>
                  </Tr>
                );
              })}
              <Tr>
                <Th colSpan={3} textAlign="right">ยอดรวม</Th>
                <Th isNumeric>฿{total.toLocaleString()}</Th>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
        <Heading size="sm" mb={3}>ที่อยู่จัดส่ง</Heading>
        <Text>{order.shippingAddress.fullName}</Text>
        <Text>{order.shippingAddress.phone}</Text>
        <Text>{order.shippingAddress.address1}{order.shippingAddress.address2 ? `, ${order.shippingAddress.address2}`:''}</Text>
        <Text>{order.shippingAddress.subdistrict} {order.shippingAddress.district} {order.shippingAddress.province} {order.shippingAddress.postcode}</Text>
      </Box>
    </Stack>
  );
}
