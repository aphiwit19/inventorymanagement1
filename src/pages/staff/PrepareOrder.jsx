import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Checkbox, Divider, Heading, HStack, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Text, useToast, RadioGroup, Radio } from '@chakra-ui/react';
import { fetchOrderById, completeOrder } from '../../services/orders';
import { getProductById } from '../../services/products';

export default function StaffPrepareOrder() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [method, setMethod] = useState('delivery'); // 'pickup' | 'delivery' - commented out, using delivery only
  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchOrderById(id);
        if (!active) return;
        setOrder(data);
        const srcItems = data.orderItems || data.items || [];
        setChecklist(srcItems.map(it => ({ productId: it.productId, checked: false })));
      } catch (e) {
        if (!active) return;
        toast({ title: e.message || 'โหลดคำสั่งซื้อไม่สำเร็จ', status: 'error' });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, toast]);

  if (loading) return <Text>กำลังโหลด...</Text>;
  if (!order) return <Text>ไม่พบคำสั่งซื้อ</Text>;

  const srcItems = order.orderItems || order.items || [];
  const items = srcItems.map(it => ({
    ...it,
    product: getProductById(it.productId),
    price: Number(it.priceAtOrder || it.price || 0),
    qty: Number(it.quantity || it.qty || 0),
  }));
  const checkedOf = (pid)=> (checklist.find(c=> c.productId===pid)?.checked) || false;
  const allChecked = items.every(it => checkedOf(it.productId));

  const onToggle = (pid, val)=> {
    setChecklist(prev => {
      const next = [...prev];
      const idx = next.findIndex(c => c.productId === pid);
      if (idx === -1) {
        next.push({ productId: pid, checked: val });
      } else {
        next[idx] = { ...next[idx], checked: val };
      }
      return next;
    });
  };

  const onConfirm = async ()=> {
    if (!allChecked) { toast({ title: 'โปรดเช็คสินค้าทุกรายการก่อน', status: 'warning' }); return; }
    try {
      await completeOrder(order.id);
      toast({ title: 'จัดของเสร็จแล้ว', status: 'success' });
      navigate('/staff/my');
    } catch (e) {
      toast({ title: e.message || 'ไม่สามารถยืนยันการจัดสินค้าได้', status: 'error' });
    }
  };

  const total = items.reduce((s,i)=> s + i.price*i.qty, 0);

  return (
    <Stack spacing={6}>
      <Heading size="lg">จัดสินค้า #{order.id}</Heading>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
        <Heading size="sm" mb={3}>ข้อมูลลูกค้า</Heading>
        <Text>{order.customer?.name || order.customer?.fullName || order.customerName}</Text>
        <Text>{order.shippingAddress?.phone || order.customer?.phone || order.customerPhone || order.phone}</Text>
        <Text color="gray.600">
          {order.shippingAddress?.address1 || ''} {order.shippingAddress?.address2 || ''} {order.shippingAddress?.subdistrict || ''} {order.shippingAddress?.district || ''} {order.shippingAddress?.province || ''} {order.shippingAddress?.postcode || ''}
        </Text>
      </Box>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
        <Heading size="sm" mb={3}>เช็ครายการสินค้า</Heading>
        {/* <HStack mb={3}>
          <Text>วิธีรับสินค้า:</Text>
          <RadioGroup value={method} onChange={setMethod}>
            <HStack spacing={6}>
              <Radio value="pickup">รับเอง</Radio>
              <Radio value="delivery">จัดส่ง</Radio>
            </HStack>
          </RadioGroup>
        </HStack> */}
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
