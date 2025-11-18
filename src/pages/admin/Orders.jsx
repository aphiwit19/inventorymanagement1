import { useMemo, useState } from 'react';
import { Box, Button, Heading, HStack, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Tag, Text, Tabs, TabList, Tab, TabPanels, TabPanel, Input } from '@chakra-ui/react';
import { listOrders } from '../../services/orders';
import { useNavigate } from 'react-router-dom';

export default function AdminOrders() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState('');
  const orders = useMemo(()=> listOrders(), [tick]);

  const totalOf = (o)=> o.items.reduce((s,i)=> s + i.price * i.qty, 0);

  const tStatus = (s)=> s==='pending'?'รอดำเนินการ': s==='in_progress'? 'กำลังดำเนินการส่ง':'ส่งสำเร็จ';
  const statusColor = (s)=> s==='pending'? 'gray': s==='in_progress'? 'blue':'green';

  const statuses = ['all','pending','in_progress','shipped'];
  const [tab, setTab] = useState(0);
  const statusOfTab = statuses[tab];
  const filtered = orders.filter(o => (statusOfTab==='all' || o.status===statusOfTab) && (q.trim()==='' || o.id.toLowerCase().includes(q.toLowerCase())));
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage-1)*pageSize, currentPage*pageSize);
  const goto = (p)=> setPage(Math.max(1, Math.min(totalPages, p)));

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
            {[0,1,2,3].map(() => (
              <TabPanel key={Math.random()} px={0}>
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
                      {paged.length === 0 && (
                        <Tr><Td colSpan={8}><Box py={8} textAlign="center" color="gray.500">ไม่พบคำสั่งซื้อ</Box></Td></Tr>
                      )}
                      {paged.map(o => (
                        <Tr key={o.id} _hover={{ bg: 'gray.50', cursor: 'pointer' }} onClick={()=> navigate(`/admin/orders/${o.id}`)}>
                          <Td>
                            <Text noOfLines={1}>{(()=>{ const p=o.id.split('-'); const tail=(p[1]||'').slice(-4); const rand=p[2]||''; return `${tail}${rand?'-'+rand:''}`; })()}</Text>
                          </Td>
                          <Td><Text noOfLines={1}>{o.shippingAddress?.fullName || o.customerName || o.customerId}</Text></Td>
                          <Td>
                            <Text noOfLines={2} color="gray.700">
                              {`${o.shippingAddress?.address1||''} ${o.shippingAddress?.address2||''} ${o.shippingAddress?.subdistrict||''} ${o.shippingAddress?.district||''} ${o.shippingAddress?.province||''} ${o.shippingAddress?.postcode||''}`.trim()}
                            </Text>
                          </Td>
                          <Td><Text noOfLines={1}>{new Date(o.createdAt).toLocaleDateString(undefined, { year:'2-digit', month:'2-digit', day:'2-digit' })}</Text></Td>
                          <Td isNumeric>฿{totalOf(o).toLocaleString()}</Td>
                          <Td>
                            <Text noOfLines={1}>{o.shippingCarrier || '-'}</Text>
                          </Td>
                          <Td>
                            <Text noOfLines={1}>{o.trackingNumber || '-'}</Text>
                          </Td>
                          <Td>
                            <Tag colorScheme={statusColor(o.status)}>{tStatus(o.status)}</Tag>
                          </Td>
                        </Tr>
                      ))}
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
