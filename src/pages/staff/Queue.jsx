import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Heading, HStack, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Text, useToast, Icon } from '@chakra-ui/react';
import { listUnassignedOrders, assignOrderToStaff } from '../../services/orders';
import { getProductById } from '../../services/products';
import { getCurrentUser } from '../../services/auth';
import { ClipboardList, Hand } from 'lucide-react';

export default function StaffQueue() {
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const orders = useMemo(()=> listUnassignedOrders(), [tick]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const user = getCurrentUser();

  const totalOf = (o)=> o.items.reduce((s,i)=> s + i.price*i.qty, 0);

  const onAssign = (o)=> {
    // มอบหมายงานให้พนักงาน (สร้างใบเบิกภายหลังในหน้าจัดสินค้า)
    assignOrderToStaff(o.id, user.id);
    toast({ title: `รับงาน ${o.id} แล้ว`, status: 'success' });
    setTick(t=> t+1);
  };

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const paged = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goto = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [tick]);

  return (
    <Stack spacing={6}>
      <Heading size="lg">คำสั่งซื้อรอจัด</Heading>
      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        <TableContainer>
          <Table size="md" variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>เลขที่</Th>
                <Th>ลูกค้า</Th>
                <Th>ที่อยู่</Th>
                <Th>รายการ</Th>
                <Th isNumeric>ยอดรวม</Th>
                <Th textAlign="right">จัดการ</Th>
              </Tr>
            </Thead>
            <Tbody>
              {orders.length === 0 && (
                <Tr><Td colSpan={6}><Box py={10} textAlign="center" color="gray.500"><Icon as={ClipboardList} mr={2} />คิวว่าง</Box></Td></Tr>
              )}
              {orders.length > 0 && paged.map(o => (
                <Tr key={o.id}>
                  <Td>{o.id}</Td>
                  <Td>{o.shippingAddress?.fullName || o.customerId}</Td>
                  <Td>
                    <Stack spacing={0} fontSize="sm">
                      <Text noOfLines={2} color="gray.600">{o.shippingAddress?.address1} {o.shippingAddress?.address2} {o.shippingAddress?.subdistrict} {o.shippingAddress?.district} {o.shippingAddress?.province} {o.shippingAddress?.postcode}</Text>
                    </Stack>
                  </Td>
                  <Td>
                    <Stack spacing={1} fontSize="sm">
                      {o.items.map((it, idx)=> {
                        const p = getProductById(it.productId);
                        return (
                          <HStack key={idx} justify="space-between">
                            <Text noOfLines={1}>{p?.name || it.productId}</Text>
                            <Text>× {it.qty}</Text>
                          </HStack>
                        );
                      })}
                    </Stack>
                  </Td>
                  <Td isNumeric>฿{totalOf(o).toLocaleString()}</Td>
                  <Td textAlign="right">
                    <Button colorScheme="blue" size="sm" leftIcon={<Icon as={Hand} />} onClick={()=> onAssign(o)}>รับงาน</Button>
                  </Td>
                </Tr>
              ))}
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
      </Box>
    </Stack>
  );
}
