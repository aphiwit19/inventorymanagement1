import { useEffect, useMemo, useState } from 'react';
import { Box, Heading, HStack, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Tag, Text, Badge, Image, Button, Tooltip } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { listOrders } from '../../services/orders';
import { getCurrentUser } from '../../services/auth';
import { getProductById } from '../../services/products';

export default function Orders() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const orders = useMemo(()=> {
    const all = listOrders();
    if (!user) return [];
    return all.filter(o => o.customerId === user.id);
  }, [user]);

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const paged = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goto = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [user?.id]);

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
              {paged.map(o => {
                const total = o.items.reduce((sum, i) => sum + i.price * i.qty, 0);
                return (
                  <Tr key={o.id} _hover={{ bg: 'gray.50', cursor: 'pointer' }} onClick={()=> navigate(`/orders/${o.id}`)}>
                    <Td maxW="180px">
                      <Tooltip label={o.id} hasArrow>
                        <Text noOfLines={1}>{o.id}</Text>
                      </Tooltip>
                    </Td>
                    <Td maxW="260px">
                      {(() => {
                        const first = o.items[0];
                        if (!first) return <Text color="gray.500">-</Text>;
                        const p = getProductById(first.productId) || {};
                        const src = (p.images && p.images[0]) || `https://picsum.photos/seed/${first.productId}/80/80`;
                        const count = o.items.reduce((s,i)=> s + Number(i.qty||0), 0);
                        return (
                          <HStack spacing={3} align="center">
                            <Image src={src} alt={p.name||first.productId} boxSize="40px" objectFit="cover" borderRadius="md" flexShrink={0} />
                            <Tooltip label={`${p.name || first.productId}${count>1 ? ` +${count-1}` : ''}`} hasArrow>
                              <Text color="gray.700" noOfLines={1}>
                                {p.name || first.productId} {count>1? `+${count-1}`:''}
                              </Text>
                            </Tooltip>
                          </HStack>
                        );
                      })()}
                    </Td>
                    <Td>
                      <Tag colorScheme={o.status === 'pending' ? 'yellow' : o.status === 'in_progress' ? 'blue' : 'green'}>
                        {o.status === 'pending' ? 'รอดำเนินการ' : o.status === 'in_progress' ? 'กำลังดำเนินการส่ง' : 'ส่งสำเร็จ'}
                      </Tag>
                    </Td>
                    <Td maxW="140px">
                      <Text noOfLines={1}>{o.shippingCarrier || '-'}</Text>
                    </Td>
                    <Td maxW="160px">
                      <Badge colorScheme={o.trackingNumber ? 'blue':'gray'} isTruncated>
                        {o.trackingNumber || '-'}
                      </Badge>
                    </Td>
                    <Td isNumeric>฿{total.toLocaleString()}</Td>
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
