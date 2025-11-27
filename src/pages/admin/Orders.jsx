import { useEffect, useState } from 'react';
import { Box, Button, Heading, HStack, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Tag, Text, Tabs, TabList, Tab, TabPanels, TabPanel, Input, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { fetchMyOrders } from '../../services/orders';

export default function AdminOrders() {
  const navigate = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [orders, setOrders] = useState([]);

  const statusTabs = ['all', 'PENDING_CONFIRMATION', 'PREPARING', 'DELIVERED'];
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  const currentPage = Math.min(page, totalPages);
  const goto = (p)=> setPage(Math.max(1, Math.min(totalPages, p)));

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const statusFilter = statusTabs[tab] === 'all' ? undefined : statusTabs[tab];
        const { orders, pagination } = await fetchMyOrders({ status: statusFilter, page: currentPage, limit: pageSize });
        if (!active) return;
        const keyword = q.trim().toLowerCase();
        const filtered = keyword
          ? (orders || []).filter(o => {
              const id = (o.id || '').toLowerCase();
              const num = (o.orderNumber || '').toLowerCase();
              return id.includes(keyword) || num.includes(keyword);
            })
          : (orders || []);
        setOrders(filtered);
        const total = pagination?.totalPages || 1;
        setTotalPages(Math.max(1, total));
      } catch (e) {
        toast({ title: e.message || 'โหลดคำสั่งซื้อไม่สำเร็จ', status: 'error' });
      }
    })();
    return () => { active = false; };
  }, [tab, currentPage, q, toast]);

  const tStatus = (s) => {
    switch (s) {
      case 'PENDING_CONFIRMATION': return 'รอยืนยัน';
      case 'PREPARING': return 'กำลังจัดเตรียม';
      case 'READY_TO_SHIP': return 'รอส่ง';
      case 'SHIPPED': return 'จัดส่งแล้ว';
      case 'DELIVERED': return 'ส่งสำเร็จ';
      case 'CANCELLED': return 'ยกเลิกแล้ว';
      default: return s || '-';
    }
  };

  const statusColor = (s) => {
    switch (s) {
      case 'PENDING_CONFIRMATION': return 'yellow';
      case 'PREPARING':
      case 'READY_TO_SHIP': return 'blue';
      case 'SHIPPED':
      case 'DELIVERED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Stack spacing={6}>
      <Heading size="lg">ประวัติคำสั่งซื้อ</Heading>
      <HStack>
        <Input placeholder="ค้นหาด้วยเลขที่คำสั่งซื้อ" value={q} onChange={(e)=> setQ(e.target.value)} maxW="sm" />
      </HStack>
      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        <Tabs index={tab} onChange={setTab} colorScheme="blue">
          <TabList>
            <Tab>ทั้งหมด</Tab>
            <Tab>รอดำเนินการ</Tab>
            <Tab>กำลังดำเนินการส่ง</Tab>
            <Tab>ส่งสำเร็จ</Tab>
          </TabList>
          <TabPanels>
            {[0,1,2,3].map((_, idx) => (
              <TabPanel key={idx} px={0}>
                <TableContainer>
                  <Table size="sm" tableLayout="fixed">
                    <Thead>
                      <Tr>
                        <Th w="12ch">รหัส</Th>
                        <Th w="14ch">ลูกค้า</Th>
                        <Th w="28ch">ที่อยู่</Th>
                        <Th w="12ch">วันที่</Th>
                        <Th isNumeric w="10ch">ยอดรวม</Th>
                        <Th w="12ch">ขนส่ง</Th>
                        <Th w="12ch">Tracking</Th>
                        <Th w="20ch">สถานะ</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {orders.length === 0 && (
                        <Tr><Td colSpan={8}><Box py={8} textAlign="center" color="gray.500">ไม่พบคำสั่งซื้อ</Box></Td></Tr>
                      )}
                      {orders.map(o => {
                        const total = o.totalAmount ?? 0;
                        const addr = o.shippingAddress || {};
                        return (
                        <Tr key={o.id} _hover={{ bg: 'gray.50', cursor: 'pointer' }} onClick={()=> navigate(`/admin/orders/${o.id}`)}>
                          <Td>
                            <Text noOfLines={1}>{(()=>{ const p=o.id.split('-'); const tail=(p[1]||'').slice(-4); const rand=p[2]||''; return `${tail}${rand?'-'+rand:''}`; })()}</Text>
                          </Td>
                          <Td><Text noOfLines={1}>{addr.recipientName || o.customerName || o.customerId}</Text></Td>
                          <Td>
                            <Text noOfLines={2} color="gray.700">
                              {`${addr.addressLine1||''} ${addr.addressLine2||''} ${addr.subDistrict||''} ${addr.district||''} ${addr.province||''} ${addr.postalCode||''}`.trim()}
                            </Text>
                          </Td>
                          <Td><Text noOfLines={1}>{new Date(o.createdAt).toLocaleDateString(undefined, { year:'2-digit', month:'2-digit', day:'2-digit' })}</Text></Td>
                          <Td isNumeric>฿{Number(total || 0).toLocaleString()}</Td>
                          <Td>
                            <Text noOfLines={1}>{o.shippingCompany || o.shippingCarrier || '-'}</Text>
                          </Td>
                          <Td>
                            <Text noOfLines={1}>{o.trackingNumber || '-'}</Text>
                          </Td>
                          <Td>
                            <Tag colorScheme={statusColor(o.status)}>{tStatus(o.status)}</Tag>
                          </Td>
                        </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
                <HStack justify="center" mt={4} spacing={1}>
                  <Button size="sm" onClick={()=> goto(currentPage-1)} isDisabled={currentPage===1}>ก่อนหน้า</Button>
                  {Array.from({length: totalPages}).slice(0,10).map((_,i)=> (
                    <Button key={i} size="sm" variant={currentPage===i+1? 'solid':'ghost'} colorScheme={currentPage===i+1?'blue':undefined} onClick={()=> goto(i+1)}>{i+1}</Button>
                  ))}
                  <Button size="sm" onClick={()=> goto(currentPage+1)} isDisabled={currentPage===totalPages}>ถัดไป</Button>
                </HStack>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Box>
    </Stack>
  );
}
