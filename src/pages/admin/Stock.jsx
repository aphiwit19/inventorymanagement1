import { useEffect, useMemo, useState } from 'react';
import { Box, Heading, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Text, HStack, Input, Select, Button } from '@chakra-ui/react';
import { listProducts } from '../../services/products';
import { listStockMovements } from '../../services/stock';

export default function AdminStock() {
  const products = useMemo(()=> listProducts(), []);
  const movements = useMemo(()=> listStockMovements(), []);
  const [type, setType] = useState('all'); // all | in | out
  const [from, setFrom] = useState(''); // yyyy-mm-dd
  const [to, setTo] = useState(''); // yyyy-mm-dd
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(()=> {
    return movements.filter(m => {
      if (type !== 'all' && m.type !== type) return false;
      const t = new Date(m.createdAt).getTime();
      if (from) {
        const fromTs = new Date(from + 'T00:00:00').getTime();
        if (t < fromTs) return false;
      }
      if (to) {
        const toTs = new Date(to + 'T23:59:59').getTime();
        if (t > toTs) return false;
      }
      return true;
    });
  }, [movements, type, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goto = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [type, from, to]);

  return (
    <Stack spacing={6}>
      <Heading size="lg">ประวัติสต็อก</Heading>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        <HStack spacing={3} flexWrap="wrap">
          <Select value={type} onChange={(e)=> setType(e.target.value)} maxW="44">
            <option value="all">ทุกประเภท</option>
            <option value="in">รับเข้า</option>
            <option value="out">จ่ายออก</option>
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
        <TableContainer>
          <Table size="md">
            <Thead>
              <Tr>
                <Th>เวลา</Th>
                <Th>สินค้า</Th>
                <Th>ประเภท</Th>
                <Th isNumeric>จำนวน</Th>
                <Th>หมายเหตุ</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paged.map(m=> {
                const p = products.find(x=> x.id===m.productId);
                return (
                  <Tr key={m.id}>
                    <Td>{new Date(m.createdAt).toLocaleString()}</Td>
                    <Td>{p ? `${p.sku} - ${p.name}` : m.productId}</Td>
                    <Td><Text color={m.type==='in'?'green.600':'red.600'} fontWeight="medium">{m.type==='in'?'รับเข้า':'จ่ายออก'}</Text></Td>
                    <Td isNumeric>{m.qty}</Td>
                    <Td>{m.note}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          <HStack justify="center" mt={4} spacing={1}>
            <Button
              size="sm"
              onClick={() => goto(currentPage - 1)}
              isDisabled={currentPage === 1 || filtered.length === 0}
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
