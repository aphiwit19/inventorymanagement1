import { useEffect, useMemo, useState } from 'react';
import { Box, Heading, HStack, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Tag, Text, Select, Input, Badge, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { listRequisitions, setRequisitionShipping, updateRequisition } from '../../services/requisitions';
import { updateOrderStatus, updateOrderShipping } from '../../services/orders';

export default function AdminRequisitions() {
  const [tick, setTick] = useState(0);
  const [drafts, setDrafts] = useState({}); // { [id]: { shippingCarrier, trackingNumber, status, saved } }
  const [q, setQ] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const data = useMemo(() => listRequisitions(), [tick]);
  const navigate = useNavigate();
  const filtered = data.filter(r => q.trim() === '' || r.id.toLowerCase().includes(q.toLowerCase()) || (r.requesterName || '').toLowerCase().includes(q.toLowerCase()));
  const tStatus = (s) => s === 'pending' ? 'รอดำเนินการ' : s === 'in_progress' ? 'กำลังดำเนินการส่ง' : 'ส่งสำเร็จ';

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goto = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // รีเซ็ตไปหน้าแรกเมื่อมีการค้นหาใหม่หรือข้อมูลเปลี่ยน
  useEffect(() => {
    setCurrentPage(1);
  }, [q, tick]);

  const getDraft = (r) => {
    const d = drafts[r.id];
    if (d) return d;
    return {
      shippingCarrier: r.shippingCarrier || '',
      trackingNumber: r.trackingNumber || '',
      status: r.status || 'pending',
      saved: false,
    };
  };
  const setDraftField = (r, field, value) => {
    setDrafts(prev => ({
      ...prev,
      [r.id]: { ...getDraft(r), [field]: value, saved: false },
    }));
  };
  const isPersistedComplete = (r) => {
    const statusAllowed = r.status === 'in_progress' || r.status === 'shipped';
    if (r.receiveMethod === 'delivery') {
      return !!(statusAllowed && r.shippingCarrier && r.trackingNumber);
    }
    return !!statusAllowed;
  };
  const isDirty = (r) => {
    const d = getDraft(r);
    return (
      (d.shippingCarrier !== (r.shippingCarrier || '')) ||
      (d.trackingNumber !== (r.trackingNumber || '')) ||
      (d.status !== (r.status || 'pending'))
    );
  };
  const onSave = (r) => {
    const d = getDraft(r);
    // persist requisition
    setRequisitionShipping(r.id, { shippingCarrier: d.shippingCarrier, trackingNumber: d.trackingNumber });
    updateRequisition(r.id, { status: d.status });
    // sync to order
    if (r.orderId) {
      if (d.shippingCarrier) updateOrderShipping(r.orderId, { shippingCarrier: d.shippingCarrier });
      if (d.trackingNumber) updateOrderShipping(r.orderId, { trackingNumber: d.trackingNumber });
      const map = d.status === 'in_progress' ? 'in_progress' : d.status === 'shipped' ? 'shipped' : 'pending';
      updateOrderStatus(r.orderId, map);
    }
    setDrafts(prev => ({ ...prev, [r.id]: { ...d, saved: true } }));
    setTick(t => t + 1);
  };
  const isComplete = (r) => {
    const d = getDraft(r);
    const statusAllowed = d.status === 'in_progress' || d.status === 'shipped';
    if (r.receiveMethod === 'delivery') {
      return !!(statusAllowed && d.shippingCarrier && d.trackingNumber);
    }
    return !!statusAllowed;
  };

  return (
    <Stack spacing={6}>
      <Heading size="lg">การเบิกสินค้า</Heading>
      <HStack>
        <Input placeholder="ค้นหาเลขที่/ผู้เบิก" value={q} onChange={(e) => setQ(e.target.value)} maxW="sm" />
      </HStack>
      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        <TableContainer overflowX="auto">
          <Table size="sm" tableLayout="fixed">
            <Thead>
              <Tr>
                <Th w="12ch">รหัส</Th>
                <Th w="12ch">พนักงาน</Th>
                <Th w="12ch">ลูกค้า</Th>
                <Th w="28ch">ที่อยู่จัดส่ง</Th>
                <Th w="12ch">วันที่</Th>
                <Th isNumeric w="10ch">ยอดรวม</Th>
                <Th w="12ch">ขนส่ง</Th>
                <Th w="12ch">Tracking</Th>
                <Th w="20ch">สถานะ</Th>
                <Th w="10ch">บันทึก</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.length === 0 && (
                <Tr><Td colSpan={10}><Box py={8} textAlign="center" color="gray.500">ไม่พบรายการเบิก</Box></Td></Tr>
              )}
              {filtered.length > 0 && paged.map(r => (
                <Tr key={r.id} _hover={{ bg: 'gray.50', cursor: 'pointer' }} onClick={() => navigate(`/admin/requisitions/${r.id}`)}>
                  <Td>
                    <Text noOfLines={1}>
                      {(() => { const p = r.id.split('-'); const tail = (p[1] || '').slice(-4); const rand = p[2] || ''; return `${tail}${rand ? '-' + rand : ''}`; })()}
                    </Text>
                  </Td>
                  <Td><Text noOfLines={1}>{r.requesterName}</Text></Td>
                  <Td><Text noOfLines={1}>{r.recipientName}</Text></Td>
                  <Td>
                    <Text noOfLines={2} color="gray.700">
                      {r.receiveMethod === 'delivery'
                        ? `${r.address?.address1 || ''} ${r.address?.address2 || ''} ${r.address?.subdistrict || ''} ${r.address?.district || ''} ${r.address?.province || ''} ${r.address?.postcode || ''}`.trim()
                        : 'รับเอง'}
                    </Text>
                  </Td>
                  <Td><Text noOfLines={1}>{new Date(r.createdAt).toLocaleDateString(undefined, { year: '2-digit', month: '2-digit', day: '2-digit' })}</Text></Td>
                  <Td isNumeric>฿{Number(r.total || 0).toLocaleString()}</Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    {r.receiveMethod === 'delivery'
                      ? (
                        <Select size="sm" placeholder="เลือกขนส่ง" value={getDraft(r).shippingCarrier} onChange={(e) => setDraftField(r, 'shippingCarrier', e.target.value)} w="100%">
                          <option value="EMS">EMS</option>
                          <option value="ไปรษณีย์ไทย">ไปรษณีย์ไทย</option>
                          <option value="Kerry">Kerry</option>
                          <option value="J&T">J&T</option>
                          <option value="Flash">Flash</option>
                        </Select>
                      ) : (
                        <Badge colorScheme="green">รับเอง</Badge>
                      )}
                  </Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    {r.receiveMethod === 'delivery' && (
                      <Input size="sm" placeholder="Tracking" value={getDraft(r).trackingNumber} onChange={(e) => setDraftField(r, 'trackingNumber', e.target.value)} w="100%" />
                    )}
                  </Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <Select size="sm" value={getDraft(r).status} onChange={(e) => setDraftField(r, 'status', e.target.value)} w="100%" fontSize="sm">
                      <option value="pending">รอดำเนินการ</option>
                      <option value="in_progress">ดำเนินการส่ง</option>
                      <option value="shipped">ส่งสำเร็จ</option>
                    </Select>
                  </Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    {(() => {
                      const saved = !isDirty(r) && isPersistedComplete(r);
                      return (
                        <Button size="xs" w="100%" colorScheme={saved ? 'green' : (isComplete(r) ? 'blue' : 'gray')} onClick={() => onSave(r)} isDisabled={!isComplete(r)}>
                          {saved ? 'บันทึกแล้ว' : 'บันทึก'}
                        </Button>
                      );
                    })()}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <HStack justify="center" mt={4} spacing={1}>
            <Button size="sm" onClick={() => goto(currentPage - 1)} isDisabled={currentPage === 1 || filtered.length === 0}>
              ก่อนหน้า
            </Button>
            {Array.from({ length: totalPages }).slice(0, 10).map((_, i) => (
              <Button
                key={i}
                size="sm"
                variant={currentPage === i + 1 ? 'solid' : 'ghost'}
                colorScheme={currentPage === i + 1 ? 'blue' : undefined}
                onClick={() => goto(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              size="sm"
              onClick={() => goto(currentPage + 1)}
              isDisabled={currentPage === totalPages || filtered.length === 0}
            >
              ถัดไป
            </Button>
          </HStack>
        </TableContainer>
      </Box>
    </Stack>
  );
}
