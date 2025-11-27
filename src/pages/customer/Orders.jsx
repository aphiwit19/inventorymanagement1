import { useEffect, useState } from 'react';
import { Box, Heading, HStack, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Tag, Text, Badge, Button, Tooltip, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../services/auth';
import { fetchMyOrders } from '../../services/orders';

export default function Orders() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const goto = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!user) {
          setOrders([]);
          setTotalPages(1);
          return;
        }
        const { orders, pagination } = await fetchMyOrders({ page: currentPage, limit: pageSize });
        if (!active) return;
        setOrders(orders || []);
        const total = pagination?.totalPages || 1;
        setTotalPages(Math.max(1, total));
      } catch (e) {
        toast({ title: e.message || 'โหลดสินค้าไม่สำเร็จ', status: 'error' });
      }
    })();
    return () => { active = false; };
  }, [toast, user, currentPage]);

  return (
    <Stack spacing={6}>
      <Heading size="lg">คำสั่งซื้อของฉัน</Heading>
      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        <TableContainer overflowX="hidden">
          <Table size="md">
            <Thead>
              <Tr>
                <Th>หมายเลข</Th>
                <Th>สินค้า</Th>
                <Th>สถานะ</Th>
                <Th>ขนส่ง</Th>
                <Th>เลขพัสดุ</Th>
                <Th isNumeric>ยอดรวม</Th>
                <Th>อัปเดตล่าสุด</Th>
              </Tr>
            </Thead>
            <Tbody>
              {orders.map(o => {
                const total = o.totalAmount ?? 0;
                const items = o.orderItems || [];
                return (
                  <Tr key={o.id} _hover={{ bg: 'gray.50', cursor: 'pointer' }} onClick={()=> navigate(`/orders/${o.id}`)}>
                    <Td maxW="180px">
                      <Tooltip label={o.id} hasArrow>
                        <Text noOfLines={1}>{o.orderNumber || o.id}</Text>
                      </Tooltip>
                    </Td>
                    <Td maxW="260px">
                      {(() => {
                        const first = items[0];
                        if (!first) return <Text color="gray.500">-</Text>;
                        const count = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
                        const name = first.productName || first.productId;
                        return (
                          <Tooltip label={`${name}${count > 1 ? ` +${count - 1}` : ''}`} hasArrow>
                            <Text color="gray.700" noOfLines={1}>
                              {name} {count > 1 ? `+${count - 1}` : ''}
                            </Text>
                          </Tooltip>
                        );
                      })()}
                    </Td>
                    <Td>
                      <Tag colorScheme={o.status === 'PENDING_CONFIRMATION' ? 'yellow' : o.status === 'SHIPPED' || o.status === 'DELIVERED' ? 'green' : 'blue'}>
                        {o.status === 'PENDING_CONFIRMATION' && 'รอยืนยัน'}
                        {o.status === 'PREPARING' && 'กำลังจัดเตรียม'}
                        {o.status === 'READY_TO_SHIP' && 'รอส่ง'}
                        {o.status === 'SHIPPED' && 'จัดส่งแล้ว'}
                        {o.status === 'DELIVERED' && 'ส่งสำเร็จ'}
                        {o.status === 'CANCELLED' && 'ยกเลิกแล้ว'}
                      </Tag>
                    </Td>
                    <Td maxW="140px">
                      <Text noOfLines={1}>{o.shippingCompany || o.shippingCarrier || '-'}</Text>
                    </Td>
                    <Td maxW="160px">
                      <Badge colorScheme={o.trackingNumber ? 'blue':'gray'} isTruncated>
                        {o.trackingNumber || '-'}
                      </Badge>
                    </Td>
                    <Td isNumeric>฿{Number(total || 0).toLocaleString()}</Td>
                    <Td>{new Date(o.updatedAt || o.createdAt).toLocaleString()}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          <HStack justify="center" mt={4} spacing={1}>
            <Button
              size="sm"
              onClick={() => goto(currentPage - 1)}
              isDisabled={currentPage === 1 || orders.length === 0}
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
              isDisabled={currentPage === totalPages || orders.length === 0}
            >
              ถัดไป
            </Button>
          </HStack>
        </TableContainer>
        {orders.length === 0 && (
          <HStack justify="center" py={8}><Text color="gray.600">ยังไม่มีคำสั่งซื้อ</Text></HStack>
        )}
      </Box>
    </Stack>
  );
}
