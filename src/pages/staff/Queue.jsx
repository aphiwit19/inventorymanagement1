import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Heading, HStack, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Text, useToast, Icon } from '@chakra-ui/react';
import { fetchStaffQueueOrders, acceptOrder } from '../../services/orders';
import { getProductById } from '../../services/products';
import { ClipboardList, Hand } from 'lucide-react';

export default function StaffQueue() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const totalOf = (o) => {
    const items = o.orderItems || o.items || [];
    return items.reduce((s, i) => s + Number(i.subtotal != null ? i.subtotal : (i.priceAtOrder || i.price || 0) * (i.quantity || i.qty || 0)), 0);
  };

  const onAssign = async (o) => {
    try {
      await acceptOrder(o.id);
      toast({ title: `รับงาน ${o.orderNumber || o.id} แล้ว`, status: 'success' });
      // trigger reload after accept
      setCurrentPage(1);
      setReloadTrigger(prev => prev + 1);
      // notify StaffLayout to refresh badge counts
      window.dispatchEvent(new CustomEvent('orderAccepted'));
    } catch (e) {
      toast({ title: e.message || 'ไม่สามารถรับงานได้', status: 'error' });
    }
  };

 

  const paged = useMemo(
    () => orders.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [orders, currentPage, pageSize]
  );

  const goto = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchStaffQueueOrders();
        if (!active) return;
        setOrders(list || []);
        const totalPagesCalc = Math.max(1, Math.ceil((list?.length || 0) / pageSize));
        setTotalPages(totalPagesCalc);
      } catch (e) {
        if (!active) return;
        setOrders([]);
        setTotalPages(1);
        toast({ title: e.message || 'โหลดคำสั่งซื้อไม่สำเร็จ', status: 'error' });
      }
    })();
    return () => { active = false; };
  }, [toast, currentPage, pageSize, reloadTrigger]);

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
                  <Td>{o.orderNumber || o.id}</Td>
                  <Td><Text noOfLines={1}>{o.shippingAddress?.recipientName || o.customer?.fullName || o.customerName || o.customerId}</Text></Td>
                  <Td>
                    <Stack spacing={0} fontSize="sm">
                      <Text noOfLines={2} color="gray.600">
                        {o.shippingAddress?.addressLine1 || o.shippingAddress?.address1 || ''} {o.shippingAddress?.addressLine2 || o.shippingAddress?.address2 || ''} {o.shippingAddress?.subDistrict || o.shippingAddress?.subdistrict || ''} {o.shippingAddress?.district || ''} {o.shippingAddress?.province || ''} {o.shippingAddress?.postalCode || o.shippingAddress?.postcode || ''}
                      </Text>
                      {(!o.shippingAddress?.addressLine1 && !o.shippingAddress?.address1 && !o.shippingAddress?.addressLine2 && !o.shippingAddress?.address2 && !o.shippingAddress?.subDistrict && !o.shippingAddress?.subdistrict && !o.shippingAddress?.district && !o.shippingAddress?.province && !o.shippingAddress?.postalCode && !o.shippingAddress?.postcode) && (
                        <Text color="gray.400">ไม่มีข้อมูลที่อยู่</Text>
                      )}
                    </Stack>
                  </Td>
                  <Td>
                    <Stack spacing={1} fontSize="sm">
                      {(o.orderItems || []).map((it, idx)=> {
                        // Use product name from backend data with fallbacks
                        const productName = it.product?.productName || it.productName || it.name || it.productId;
                        return (
                          <HStack key={idx} justify="space-between">
                            <Text noOfLines={1}>{productName}</Text>
                            <Text>× {it.quantity || it.qty}</Text>
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
