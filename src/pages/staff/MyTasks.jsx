import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Heading, HStack, Stack, Tabs, TabList, Tab, TabPanels, TabPanel, Table, TableContainer, Thead, Tr, Th, Tbody, Td, Text, Tag, Badge, Icon } from '@chakra-ui/react';
import { getCurrentUser } from '../../services/auth';
import { fetchMyOrders } from '../../services/orders';
import { Link as RouterLink } from 'react-router-dom';
import { CheckCircle2, ClipboardList } from 'lucide-react';

export default function StaffMyTasks() {
  const user = getCurrentUser();
  const [preparingOrders, setPreparingOrders] = useState([]);
  const [preparedOrders, setPreparedOrders] = useState([]);
  const [currentPreparingPage, setCurrentPreparingPage] = useState(1);
  const [currentPreparedPage, setCurrentPreparedPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [{ orders: preparing }, { orders: prepared }] = await Promise.all([
          fetchMyOrders({ status: 'PREPARING', page: 1, limit: 100 }),
          fetchMyOrders({ status: 'READY_TO_SHIP', page: 1, limit: 100 }),
        ]);
        if (!active) return;
        setPreparingOrders(preparing || []);
        setPreparedOrders(prepared || []);
      } catch {
        if (!active) return;
        setPreparingOrders([]);
        setPreparedOrders([]);
      }
    })();
    return () => { active = false; };
  }, []);

  // reset pages when orders change
  useEffect(() => {
    setCurrentPreparingPage(1);
    setCurrentPreparedPage(1);
  }, [preparingOrders.length, preparedOrders.length]);

  const preparing = preparingOrders;
  const prepared = preparedOrders;

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
                <Td>{o.orderNumber || o.id}</Td>
                <Td>{o.shippingAddress?.fullName || o.customerName || o.customerId}</Td>
                <Td>{new Date(o.updatedAt || o.createdAt).toLocaleString()}</Td>
                <Td>
                  {(() => {
                    const status = o.status || '';
                    const label = status === 'PENDING_CONFIRMATION'
                      ? 'รอยืนยัน'
                      : status === 'PREPARING'
                      ? 'กำลังจัดเตรียม'
                      : status === 'READY_TO_SHIP'
                      ? 'รอส่ง'
                      : status === 'SHIPPED'
                      ? 'จัดส่งแล้ว'
                      : status === 'DELIVERED'
                      ? 'ส่งสำเร็จ'
                      : status === 'CANCELLED'
                      ? 'ยกเลิกแล้ว'
                      : status || '-';
                    const color = status === 'PENDING_CONFIRMATION'
                      ? 'yellow'
                      : status === 'PREPARING'
                      ? 'blue'
                      : status === 'READY_TO_SHIP'
                      ? 'purple'
                      : status === 'SHIPPED'
                      ? 'cyan'
                      : status === 'DELIVERED'
                      ? 'green'
                      : status === 'CANCELLED'
                      ? 'red'
                      : 'gray';
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
