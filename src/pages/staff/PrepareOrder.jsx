import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Checkbox, Divider, Heading, HStack, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Text, useToast, RadioGroup, Radio } from '@chakra-ui/react';
import { getOrderById, updateOrderChecklist, markOrderPrepared, updateOrderShipping } from '../../services/orders';
import { createRequisition } from '../../services/requisitions';
import { getProductById } from '../../services/products';

export default function StaffPrepareOrder() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [method, setMethod] = useState('delivery'); // 'pickup' | 'delivery'
  const order = useMemo(()=> getOrderById(id), [id, tick]);

  if (!order) return <Text>ไม่พบคำสั่งซื้อ</Text>;

  const items = order.items.map(it => ({ ...it, product: getProductById(it.productId) }));
  const checklist = order.checklist || [];
  const checkedOf = (pid)=> (checklist.find(c=> c.productId===pid)?.checked) || false;
  const allChecked = items.every(it => checkedOf(it.productId));

  const onToggle = (pid, val)=> {
    updateOrderChecklist(order.id, pid, val);
    setTick(t=> t+1);
  };

  const onConfirm = ()=> {
    if (!allChecked) { toast({ title: 'โปรดเช็คสินค้าทุกรายการก่อน', status: 'warning' }); return; }
    const updated = markOrderPrepared(order.id);
    if (!updated) { toast({ title: 'ไม่สามารถยืนยันได้', status: 'error' }); return; }
    // Create requisition from this order with selected receive method
    const purpose = method === 'pickup' ? 'รับสินค้าเอง' : `เบิกเพื่อจัดส่งคำสั่งซื้อ ${order.id}`;
    createRequisition({
      orderId: order.id,
      requesterId: order.assignedStaffId || 'staff',
      requesterName: 'Staff',
      recipientName: order.shippingAddress?.fullName || 'ลูกค้า',
      purpose,
      receiveMethod: method,
      address: method === 'delivery' ? (order.shippingAddress || null) : null,
      items: (order.items || []).map(it => ({ productId: it.productId, qty: it.qty, price: it.price })),
    });
    if (method === 'pickup') {
      // mark order shipped immediately for pickup
      updateOrderShipping(order.id, { status: 'shipped' });
    }
    toast({ title: 'จัดของเสร็จแล้ว', status: 'success' });
    navigate('/staff/my');
  };

  const total = items.reduce((s,i)=> s + i.price*i.qty, 0);

  return (
    <Stack spacing={6}>
      <Heading size="lg">จัดสินค้า #{order.id}</Heading>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
        <Heading size="sm" mb={3}>ข้อมูลลูกค้า</Heading>
        <Text>{order.shippingAddress?.fullName}</Text>
        <Text>{order.shippingAddress?.phone}</Text>
        <Text color="gray.600">{order.shippingAddress?.address1} {order.shippingAddress?.address2} {order.shippingAddress?.subdistrict} {order.shippingAddress?.district} {order.shippingAddress?.province} {order.shippingAddress?.postcode}</Text>
      </Box>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
        <Heading size="sm" mb={3}>เช็ครายการสินค้า</Heading>
        <HStack mb={3}>
          <Text>วิธีรับสินค้า:</Text>
          <RadioGroup value={method} onChange={setMethod}>
            <HStack spacing={6}>
              <Radio value="pickup">รับเอง</Radio>
              <Radio value="delivery">จัดส่ง</Radio>
            </HStack>
          </RadioGroup>
        </HStack>
        <TableContainer>
          <Table size="md">
            <Thead>
              <Tr>
                <Th>รายการ</Th>
                <Th isNumeric>ราคา</Th>
                <Th isNumeric>จำนวน</Th>
                <Th isNumeric>รวม</Th>
                <Th>เช็ค</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((it, idx)=> (
                <Tr key={idx}>
                  <Td><Text noOfLines={1}>{it.product?.name || it.productId}</Text></Td>
                  <Td isNumeric>฿{it.price.toLocaleString()}</Td>
                  <Td isNumeric>{it.qty}</Td>
                  <Td isNumeric>฿{(it.price*it.qty).toLocaleString()}</Td>
                  <Td>
                    <Checkbox isChecked={checkedOf(it.productId)} onChange={(e)=> onToggle(it.productId, e.target.checked)} />
                  </Td>
                </Tr>
              ))}
              <Tr>
                <Th colSpan={3} textAlign="right">ยอดรวม</Th>
                <Th isNumeric>฿{total.toLocaleString()}</Th>
                <Th></Th>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
        <Divider my={4} />
        <HStack justify="flex-end">
          <Button colorScheme="blue" onClick={onConfirm} isDisabled={!allChecked}>ยืนยัน: จัดของเสร็จแล้ว</Button>
        </HStack>
      </Box>
    </Stack>
  );
}
