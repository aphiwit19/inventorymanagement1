import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Heading, Stack, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer, HStack, Tag, Select, Input, Badge, Button, Link, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import { getRequisitionById, updateRequisition, setRequisitionShipping } from '../../services/requisitions';
import { updateOrderStatus, updateOrderShipping } from '../../services/orders';
import { getProductById } from '../../services/products';

export default function AdminRequisitionDetail() {
  const { id } = useParams();
  const req = getRequisitionById(id);
  const toast = useToast();

  const total = ((req?.items) || []).reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0);

  const tStatus = (s) => s === 'pending' ? 'รอดำเนินการ' : s === 'in_progress' ? 'ดำเนินการส่ง' : 'ส่งสำเร็จ';

  // Draft state
  const [status, setStatus] = useState(req?.status || 'pending');
  const [carrier, setCarrier] = useState(req?.shippingCarrier || '');
  const [tracking, setTracking] = useState(req?.trackingNumber || '');
  const dirty = !!req && ((status !== req.status) || (carrier !== (req.shippingCarrier || '')) || (tracking !== (req.trackingNumber || '')));
  const needShipInfo = req?.receiveMethod === 'delivery' && (status === 'in_progress' || status === 'shipped');
  const canSave = dirty && (!needShipInfo || (carrier && tracking));

  const onSave = () => {
    if (!req) return;
    // persist requisition shipping and status together
    setRequisitionShipping(req.id, { shippingCarrier: carrier, trackingNumber: tracking, status });
    if (req.orderId) {
      const map = status === 'in_progress' ? 'in_progress' : status === 'shipped' ? 'shipped' : 'pending';
      updateOrderStatus(req.orderId, map);
      updateOrderShipping(req.orderId, { shippingCarrier: carrier, trackingNumber: tracking });
    }
    toast({ title: 'บันทึกแล้ว', status: 'success' });
  };

  return (
    <Stack spacing={6}>
      {!req ? (
        <Text>ไม่พบรายการเบิก</Text>
      ) : (
        <>
          <Heading size="lg">รายการเบิก #{req.id}</Heading>

          <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
            <HStack justify="space-between" mb={3} align="flex-start">
              <Stack spacing={1}>
                <Text>ผู้เบิก: {req.requesterName}</Text>
                <Text>ลูกค้า: {req.recipientName}</Text>
                {req.orderId && (
                  <Text>คำสั่งซื้อที่เกี่ยวข้อง: <Link as={RouterLink} color="blue.500" to={`/admin/orders/${req.orderId}`}>{req.orderId}</Link></Text>
                )}
              </Stack>
              <HStack spacing={4}>
                <Select size="sm" value={status} onChange={(e) => setStatus(e.target.value)} maxW="52">
                  <option value="pending">รอดำเนินการ</option>
                  <option value="in_progress">ดำเนินการส่ง</option>
                  <option value="shipped">ส่งสำเร็จ</option>
                </Select>
                <Button colorScheme="blue" size="sm" onClick={onSave} isDisabled={!canSave}>บันทึก</Button>
              </HStack>
            </HStack>
            <Text color="gray.600">วันที่: {new Date(req.createdAt).toLocaleDateString()}</Text>
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
                  {(req.items || []).map((it, idx) => (
                    <Tr key={idx}>
                      <Td>{getProductById(it.productId)?.name || it.productId}</Td>
                      <Td isNumeric>฿{Number(it.price || 0).toLocaleString()}</Td>
                      <Td isNumeric>{it.qty}</Td>
                      <Td isNumeric>฿{Number((it.price || 0) * Number(it.qty || 0)).toLocaleString()}</Td>
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
            {req.receiveMethod === 'delivery' ? (
              <Stack spacing={1}>
                <Text>{req.address?.fullName}</Text>
                <Text>{req.address?.phone}</Text>
                <Text>{req.address?.address1}{req.address?.address2 ? `, ${req.address?.address2}` : ''}</Text>
                <Text>{req.address?.subdistrict} {req.address?.district} {req.address?.province} {req.address?.postcode}</Text>
              </Stack>
            ) : (
              <Badge colorScheme="green">รับเอง</Badge>
            )}
          </Box>

          <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
            <Heading size="sm" mb={3}>การจัดส่ง</Heading>
            {req.receiveMethod === 'delivery' ? (
              <HStack spacing={3} align="center">
                <Select size="sm" placeholder="เลือกขนส่ง" value={carrier} onChange={(e) => setCarrier(e.target.value)} maxW="48">
                  <option value="EMS">EMS</option>
                  <option value="ไปรษณีย์ไทย">ไปรษณีย์ไทย</option>
                  <option value="Kerry">Kerry</option>
                  <option value="J&T">J&T</option>
                  <option value="Flash">Flash</option>
                </Select>
                <Input size="sm" placeholder="Tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} maxW="56" />
              </HStack>
            ) : (
              <Text color="gray.600">ไม่มีการจัดส่ง</Text>
            )}
          </Box>
        </>
      )}
    </Stack>
  );
}
