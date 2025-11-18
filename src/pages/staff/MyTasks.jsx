import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Heading, HStack, Stack, Tabs, TabList, Tab, TabPanels, TabPanel, Table, TableContainer, Thead, Tr, Th, Tbody, Td, Text, Tag, Badge, Icon } from '@chakra-ui/react';
import { getCurrentUser } from '../../services/auth';
import { listOrdersByStaff } from '../../services/orders';
import { Link as RouterLink } from 'react-router-dom';
import { CheckCircle2, ClipboardList } from 'lucide-react';

export default function StaffMyTasks() {
  const user = getCurrentUser();
  const [tick] = useState(0);
  const orders = useMemo(()=> listOrdersByStaff(user?.id || ''), [user?.id, tick]);
  const [currentPreparingPage, setCurrentPreparingPage] = useState(1);
  const [currentPreparedPage, setCurrentPreparedPage] = useState(1);
  const pageSize = 10;

  // reset pages when orders change
  useEffect(() => {
    setCurrentPreparingPage(1);
    setCurrentPreparedPage(1);
  }, [orders.length]);

  const preparing = orders.filter(o => o.assignedStaffId === user?.id && !o.staffPrepared);
  const prepared = orders.filter(o => o.assignedStaffId === user?.id && o.staffPrepared);

  const TableView = ({ data, showPrepare, currentPage, setCurrentPage }) => {
    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
    const paged = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const goto = (page) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
    };

    return (
      <TableContainer>
        <Table size="md" variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>เลขที่</Th>
              <Th>ลูกค้า</Th>
              <Th>อัปเดต</Th>
              <Th>สถานะ</Th>
              <Th textAlign="right">จัดการ</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.length === 0 && (
              <Tr>
                <Td colSpan={5}>
                  <Box py={10} textAlign="center" color="gray.500">
                    <Icon as={ClipboardList} mr={2} />ไม่มีรายการ
                  </Box>
                </Td>
              </Tr>
            )}
            {data.length > 0 && paged.map(o => (
              <Tr key={o.id}>
                <Td>{o.id}</Td>
                <Td>{o.shippingAddress?.fullName || o.customerName || o.customerId}</Td>
                <Td>{new Date(o.updatedAt || o.createdAt).toLocaleString()}</Td>
                <Td>
                  {(() => {
                    const label = o.status==='pending' ? 'รอดำเนินการ' : o.status==='in_progress' ? 'กำลังดำเนินการส่ง' : 'ส่งสำเร็จ';
                    const color = o.status==='pending' ? 'yellow' : o.status==='in_progress' ? 'blue' : 'green';
                    return <Tag size="sm" colorScheme={color}>{label}</Tag>;
                  })()}
                </Td>
                <Td textAlign="right">
                  {showPrepare ? (
                    <Button as={RouterLink} to={`/staff/order/${o.id}`} size="sm" colorScheme="blue" leftIcon={<Icon as={ClipboardList} />}>
                      เตรียมสินค้า
                    </Button>
                  ) : (
                    <HStack justify="flex-end">
                      <Icon as={CheckCircle2} color="green.500" />
                      <Text color="green.600" fontWeight="medium">จัดเสร็จแล้ว</Text>
                    </HStack>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <HStack justify="center" mt={4} spacing={1}>
          <Button
            size="sm"
            onClick={() => goto(currentPage - 1)}
            isDisabled={currentPage === 1 || data.length === 0}
          >
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
            isDisabled={currentPage === totalPages || data.length === 0}
          >
            ถัดไป
          </Button>
        </HStack>
      </TableContainer>
    );
  };

  return (
    <Stack spacing={6}>
      <Heading size="lg">งานของฉัน</Heading>
      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        <Tabs colorScheme="blue">
          <TabList>
            <Tab>กำลังจัด <Badge ml={2}>{preparing.length}</Badge></Tab>
            <Tab>จัดเสร็จแล้ว <Badge ml={2}>{prepared.length}</Badge></Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0}>
              <TableView data={preparing} showPrepare currentPage={currentPreparingPage} setCurrentPage={setCurrentPreparingPage} />
            </TabPanel>
            <TabPanel px={0}>
              <TableView data={prepared} currentPage={currentPreparedPage} setCurrentPage={setCurrentPreparedPage} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Stack>
  );
}
