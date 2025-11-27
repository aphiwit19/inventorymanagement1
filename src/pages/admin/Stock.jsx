import { useEffect, useMemo, useState } from 'react';
import { Box, Heading, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Text, HStack, Input, Select, Button, Badge, useToast, Spinner } from '@chakra-ui/react';
import { fetchStockMovements, fetchStockProducts } from '../../services/stockMovements';

export default function AdminStock() {
  const toast = useToast();
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  
  const [type, setType] = useState('all'); // all | IN | OUT | ADJUSTMENT
  const [from, setFrom] = useState(''); // yyyy-mm-dd
  const [to, setTo] = useState(''); // yyyy-mm-dd
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const [movementsData, productsData] = await Promise.all([
        fetchStockMovements({ type, startDate: from, endDate: to, page: currentPage, limit: pageSize }),
        fetchStockProducts()
      ]);
      
      setMovements(movementsData.movements || movementsData.data?.movements || []);
      setPagination(movementsData.pagination || movementsData.data?.pagination);
      setProducts(productsData.products || productsData.data?.products || []);
    } catch (e) {
      toast({ title: e.message || 'โหลดข้อมูลไม่สำเร็จ', status: 'error' });
      setMovements([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [type, from, to, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [type, from, to]);

  const totalPages = pagination?.totalPages || 1;

  const goto = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getMovementTypeLabel = (movementType) => {
    switch (movementType) {
      case 'IN': return { label: 'รับเข้า', color: 'green' };
      case 'OUT': return { label: 'จ่ายออก', color: 'red' };
      case 'ADJUSTMENT': return { label: 'ปรับปรุง', color: 'orange' };
      default: return { label: movementType, color: 'gray' };
    }
  };

  const getMovementReason = (movement) => {
    const { movementType, reason, referenceType, referenceId } = movement;
    
    if (movementType === 'OUT') {
      if (referenceType === 'ORDER' || referenceType === 'REQUISITION') {
        return `เบิกออก #${referenceId}`;
      }
      return reason || 'จ่ายออก';
    }
    
    if (movementType === 'IN') {
      if (reason?.includes('สินค้าใหม่') || reason?.includes('new product')) {
        return 'เพิ่มสินค้าใหม่';
      }
      if (reason?.includes('สินค้าเดิม') || reason?.includes('restock')) {
        return 'เพิ่มสินค้าเดิม';
      }
      return reason || 'รับเข้า';
    }
    
    if (movementType === 'ADJUSTMENT') {
      return reason || 'ปรับปรุง';
    }
    
    return reason || movementType;
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.sku || product.id} - ${product.name}` : productId;
  };

  if (loading && movements.length === 0) {
    return (
      <Stack spacing={6} align="center" py={10}>
        <Spinner size="xl" />
        <Text>กำลังโหลดข้อมูล...</Text>
      </Stack>
    );
  }

  return (
    <Stack spacing={6}>
      <Heading size="lg">ประวัติสต็อก</Heading>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        <HStack spacing={3} flexWrap="wrap">
          <Select value={type} onChange={(e)=> setType(e.target.value)} maxW="44">
            <option value="all">ทุกประเภท</option>
            <option value="IN">รับเข้า</option>
            <option value="OUT">จ่ายออก</option>
            <option value="ADJUSTMENT">ปรับปรุง</option>
          </Select>
          <HStack>
            <Text>ตั้งแต่</Text>
            <Input type="date" value={from} onChange={(e)=> setFrom(e.target.value)} maxW="48" />
            <Text>ถึง</Text>
            <Input type="date" value={to} onChange={(e)=> setTo(e.target.value)} maxW="48" />
          </HStack>
          <Button variant="ghost" onClick={()=> { setType('all'); setFrom(''); setTo(''); }}>ล้างตัวกรอง</Button>
        </HStack>
      </Box>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={5}>
        <Heading size="sm" mb={4}>รายการล่าสุด</Heading>
        
        {movements.length === 0 ? (
          <Box py={8} textAlign="center" color="gray.500">
            <Text>ไม่พบข้อมูลที่ตรงกับเงื่อนไข</Text>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="md">
                <Thead>
                  <Tr>
                    <Th>วันที่</Th>
                    <Th>สินค้า</Th>
                    <Th>ประเภท</Th>
                    <Th isNumeric>จำนวน</Th>
                    <Th>หมายเหตุ</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {movements.map(m => {
                    const typeInfo = getMovementTypeLabel(m.movementType);
                    return (
                      <Tr key={m.id}>
                        <Td>{new Date(m.createdAt).toLocaleDateString()}</Td>
                        <Td>{getProductName(m.productId)}</Td>
                        <Td>
                          <Badge colorScheme={typeInfo.color}>
                            {typeInfo.label}
                          </Badge>
                        </Td>
                        <Td isNumeric>{m.quantity}</Td>
                        <Td>
                          <Stack spacing={0}>
                            <Text noOfLines={1}>{getMovementReason(m)}</Text>
                            {m.note && <Text fontSize="xs" color="gray.500" noOfLines={1}>{m.note}</Text>}
                          </Stack>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>

            {pagination && pagination.total > pageSize && (
              <HStack justify="center" mt={4} spacing={1}>
                <Button
                  size="sm"
                  onClick={() => goto(currentPage - 1)}
                  isDisabled={currentPage === 1}
                >
                  ก่อนหน้า
                </Button>
                {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
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
                  isDisabled={currentPage === totalPages}
                >
                  ถัดไป
                </Button>
              </HStack>
            )}
          </>
        )}
      </Box>
    </Stack>
  );
}
