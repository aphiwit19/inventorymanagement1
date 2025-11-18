import { useEffect, useMemo, useState } from 'react';
import { Box, Heading, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, HStack, Select, Input, Tag, useToast, Button } from '@chakra-ui/react';
import { listUsers, updateUserRole } from '../../services/auth';

export default function AdminUsers() {
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const users = useMemo(()=> listUsers(), [tick]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = users.filter(u =>
    (q.trim()==='' || u.name?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase())) &&
    (role==='all' || u.role===role)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goto = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [q, role, tick]);

  const onChangeRole = (u, r) => {
    updateUserRole(u.id, r);
    toast({ title: `เปลี่ยนสิทธิ์ของ ${u.name || u.email} เป็น ${r}`, status: 'success' });
    setTick(t=> t+1);
  };

  return (
    <Stack spacing={6}>
      <Heading size="lg">จัดการผู้ใช้</Heading>
      <HStack>
        <Input placeholder="ค้นหาชื่อหรืออีเมล" value={q} onChange={(e)=> setQ(e.target.value)} maxW="sm" />
        <Select value={role} onChange={(e)=> setRole(e.target.value)} maxW="40">
          <option value="all">ทุกบทบาท</option>
          <option value="admin">admin</option>
          <option value="staff">staff</option>
          <option value="customer">customer</option>
        </Select>
      </HStack>
      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        <TableContainer>
          <Table size="md">
            <Thead>
              <Tr>
                <Th>ชื่อ</Th>
                <Th>อีเมล</Th>
                <Th>เบอร์</Th>
                <Th>สมัครเมื่อ</Th>
                <Th>บทบาทปัจจุบัน</Th>
                <Th>เปลี่ยนบทบาท</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paged.map(u => (
                <Tr key={u.id}>
                  <Td>{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>{u.phone || '-'}</Td>
                  <Td>{new Date(u.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <Tag size="sm" colorScheme={u.role==='admin'?'purple':u.role==='staff'?'blue':'gray'}>{u.role}</Tag>
                  </Td>
                  <Td>
                    <Select size="sm" value={u.role} onChange={(e)=> onChangeRole(u, e.target.value)} maxW="40">
                      <option value="admin">admin</option>
                      <option value="staff">staff</option>
                      <option value="customer">customer</option>
                    </Select>
                  </Td>
                </Tr>
              ))}
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
