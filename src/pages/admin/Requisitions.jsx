import { useEffect, useMemo, useState } from 'react';
import { Box, Heading, HStack, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Tag, Text, Select, Input, Badge, Button, Spinner } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { fetchMyOrders, addTracking, confirmDelivery, updateOrderStatus } from '../../services/orders';

export default function AdminRequisitions() {
  const [tick, setTick] = useState(0);
  const [drafts, setDrafts] = useState({}); // { [id]: { shippingCarrier, trackingNumber, status, saved } }
  const [q, setQ] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Load orders with READY_TO_SHIP status
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetchMyOrders({ status: 'READY_TO_SHIP', page: 1, limit: 100 });
        setData(res.orders || []);
      } catch (error) {
        console.error('Failed to load orders:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [tick]);
  
  const filtered = data.filter(r => q.trim() === '' || (r.orderNumber || r.id).toLowerCase().includes(q.toLowerCase()) || (r.customer?.name || '').toLowerCase().includes(q.toLowerCase()));
  const tStatus = (s) => s === 'READY_TO_SHIP' ? 'จัดเสร็จแล้ว' : s === 'SHIPPED' ? 'กำลังส่ง' : 'ส่งสำเร็จ';

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
  const onSave = async (r) => {
    const d = getDraft(r);
    try {
      // Add tracking number -> backend auto changes to SHIPPED
      if (d.trackingNumber && d.trackingNumber !== (r.trackingNumber || '')) {
        await addTracking(r.id, { 
          trackingNumber: d.trackingNumber, 
          shippingCompany: d.shippingCarrier 
        });
      }
      
      setDrafts(prev => ({ ...prev, [r.id]: { ...d, saved: true } }));
      setTick(t => t + 1);
    } catch (error) {
      console.error('Failed to save order:', error);
    }
  };

  const onConfirmDelivery = async (r) => {
    try {
      await confirmDelivery(r.id);
      setTick(t => t + 1);
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
    }
  };
  const isComplete = (r) => {
    const d = getDraft(r);
    const trackingValid = d.trackingNumber && d.trackingNumber.length >= 5 && d.trackingNumber.length <= 50;
    return !!trackingValid;
  };

  if (loading) {
    return (
      <Stack spacing={6} align="center" py={10}>
        <Spinner size="xl" />
        <Text>กำลังโหลดข้อมูล...</Text>
      </Stack>
    );
  }

  return (
    <Stack spacing={6}>
      <Heading size="lg">รายการเบิกสินค้า</Heading>
      <HStack>
        <Input placeholder="ค้นหาเลขที่/ลูกค้า" value={q} onChange={(e) => setQ(e.target.value)} maxW="sm" />
      </HStack>
      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        <TableContainer overflowX="auto">
          <Table size="sm" tableLayout="fixed">
            <Thead>
              <Tr>
                <Th w="12ch">เลขที่ออเดอร์</Th>
                <Th w="12ch">พนักงานจัด</Th>
                <Th w="12ch">ลูกค้า</Th>
                <Th w="28ch">ที่อยู่จัดส่ง</Th>
                <Th w="12ch">วันที่</Th>
                <Th isNumeric w="10ch">ยอดรวม</Th>
                <Th w="12ch">ขนส่ง</Th>
                <Th w="12ch">Tracking</Th>
                <Th w="10ch">จัดการ</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.length === 0 && (
                <Tr><Td colSpan={9}><Box py={8} textAlign="center" color="gray.500">ไม่พบออเดอร์ที่พร้อมส่ง</Box></Td></Tr>
              )}
              {filtered.length > 0 && paged.map(r => (
                <Tr key={r.id} _hover={{ bg: 'gray.50', cursor: 'pointer' }} onClick={() => navigate(`/admin/requisitions/${r.id}`)}>
                  <Td>
                    <Text noOfLines={1}>{r.orderNumber || r.id}</Text>
                  </Td>
                  <Td><Text noOfLines={1}>{r.staff?.fullName || r.staffName || '-'}</Text></Td>
                  <Td><Text noOfLines={1}>{r.customer?.fullName || r.customerName}</Text></Td>
                  <Td>
                    <Text noOfLines={2} color="gray.700">
                      {r.shippingAddress?.addressLine1} {r.shippingAddress?.addressLine2} {r.shippingAddress?.subDistrict} {r.shippingAddress?.district} {r.shippingAddress?.province} {r.shippingAddress?.postalCode}
                    </Text>
                  </Td>
                  <Td><Text noOfLines={1}>{new Date(r.createdAt || r.orderDate).toLocaleDateString(undefined, { year: '2-digit', month: '2-digit', day: '2-digit' })}</Text></Td>
                  <Td isNumeric>฿{Number(r.totalAmount || r.total || 0).toLocaleString()}</Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <Select size="sm" placeholder="เลือกขนส่ง" value={getDraft(r).shippingCarrier || r.shippingCompany || ''} onChange={(e) => setDraftField(r, 'shippingCarrier', e.target.value)} w="120px" fontSize="xs">
                      <option value="EMS">EMS</option>
                      <option value="ไปรษณีย์ไทย">ไปรษณีย์ไทย</option>
                      <option value="Kerry">Kerry</option>
                      <option value="J&T">J&T</option>
                      <option value="Flash">Flash</option>
                    </Select>
                  </Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <Input 
                      size="sm" 
                      placeholder="Tracking (5-50 ตัวอักษร)" 
                      value={getDraft(r).trackingNumber} 
                      onChange={(e) => setDraftField(r, 'trackingNumber', e.target.value)} 
                      w="100%" 
                      isInvalid={getDraft(r).trackingNumber && (getDraft(r).trackingNumber.length < 5 || getDraft(r).trackingNumber.length > 50)}
                    />
                  </Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    {r.status === 'SHIPPED' ? (
                      <Button size="sm" colorScheme="green" w="100%" onClick={() => onConfirmDelivery(r)}>
                        ยืนยันการส่งถึง
                      </Button>
                    ) : (
                      <Button size="sm" colorScheme={isComplete(r) ? 'blue' : 'gray'} w="100%" onClick={() => onSave(r)} isDisabled={!isComplete(r)}>
                        บันทึก
                      </Button>
                    )}
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
