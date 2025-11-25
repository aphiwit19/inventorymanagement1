import { useEffect, useState } from 'react';
import { Box, Heading, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, HStack, Select, Input, Tag, useToast, Button, Spinner, Text } from '@chakra-ui/react';
import { fetchUsers, promoteUser } from '../../services/users';

export default function AdminUsers() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 10 });
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [isActive, setIsActive] = useState('all');

  const page = pagination.page || 1;
  const totalPages = Math.max(1, pagination.totalPages || 1);

  const load = async (opts = {}) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchUsers({
        role: role === 'all' ? undefined : role,
        isActive: isActive === 'all' ? undefined : isActive === 'true',
        page: opts.page || pagination.page || 1,
        limit: pagination.limit || 10,
      });
      let list = res.users;
      // If UI selects admin, but backend role filter supports only CUSTOMER/STAFF, filter on client
      if (role !== 'all') {
        const rr = role.toLowerCase();
        list = list.filter(u => u.role === rr);
      }
      if (q.trim() !== '') {
        const qq = q.toLowerCase();
        list = list.filter(u => (u.name || '').toLowerCase().includes(qq) || (u.email || '').toLowerCase().includes(qq));
      }
      setUsers(list);
      setPagination(res.pagination);
    } catch (e) {
      const raw = e?.message || '';
      const msg = raw && /not defined|internal server error/i.test(raw)
        ? 'เซิร์ฟเวอร์มีปัญหาชั่วคราวในการดึงข้อมูลผู้ใช้ กรุณาลองใหม่อีกครั้ง'
        : (raw || 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
      setError(msg);
      toast({ title: msg, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // reset to first page when filters/search change
    setPagination(p => ({ ...p, page: 1 }));
  }, [role, isActive, q]);

  useEffect(() => {
    load({ page: pagination.page || 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, isActive, pagination.page]);

  const goto = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPagination(p => ({ ...p, page: nextPage }));
  };

  const onChangeRole = async (u, r) => {
    if (u.role === 'admin') return; // cannot change admin
    if (u.role === r) return; // no change
    const confirmed = window.confirm(`ยืนยันการเปลี่ยนบทบาทของ ${u.name || u.email} เป็น ${r}?`);
    if (!confirmed) return;
    try {
      await promoteUser(u.id, r);
      toast({ title: `เปลี่ยนสิทธิ์ของ ${u.name || u.email} เป็น ${r} สำเร็จ`, status: 'success' });
      load({ page });
    } catch (e) {
      const raw = e?.message || '';
      const msg = raw && /not defined|internal server error/i.test(raw)
        ? 'ไม่สามารถเปลี่ยนบทบาทได้ (ข้อผิดพลาดจากเซิร์ฟเวอร์) กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ'
        : (raw || 'เปลี่ยนบทบาทไม่สำเร็จ');
      toast({ title: msg, status: 'error' });
    }
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
        <Select value={isActive} onChange={(e)=> setIsActive(e.target.value)} maxW="40">
          <option value="all">ทุกสถานะ</option>
          <option value="true">active</option>
          <option value="false">inactive</option>
        </Select>
        <Button size="sm" onClick={() => load({ page: 1 })} isDisabled={loading}>รีเฟรช</Button>
      </HStack>
      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        {loading && (
          <HStack mb={4}>
            <Spinner size="sm" />
            <Text fontSize="sm">กำลังดึงข้อมูลผู้ใช้...</Text>
          </HStack>
        )}
        {error && (
          <Text color="red.500" mb={2} fontSize="sm">{error}</Text>
        )}
        <TableContainer>
          <Table size="md">
            <Thead>
              <Tr>
                <Th>ชื่อ</Th>
                <Th>อีเมล</Th>
                <Th>เบอร์</Th>
                <Th>สถานะ</Th>
                <Th>สมัครเมื่อ</Th>
                <Th>บทบาทปัจจุบัน</Th>
                <Th>เปลี่ยนบทบาท</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map(u => (
                <Tr key={u.id}>
                  <Td>{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>{u.phone || '-'}</Td>
                  <Td>
                    <Tag size="sm" colorScheme={u.isActive ? 'green' : 'gray'}>{u.isActive ? 'active' : 'inactive'}</Tag>
                  </Td>
                  <Td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</Td>
                  <Td>
                    <Tag size="sm" colorScheme={u.role==='admin'?'purple':u.role==='staff'?'blue':'gray'}>{u.role}</Tag>
                  </Td>
                  <Td>
                    <Select size="sm" value={u.role} onChange={(e)=> onChangeRole(u, e.target.value)} maxW="40" isDisabled={u.role==='admin' || loading}>
                      {/* ตามข้อกำหนด เปลี่ยนได้เฉพาะ CUSTOMER <-> STAFF */}
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
              onClick={() => goto(page - 1)}
              isDisabled={page === 1 || users.length === 0}
            >
              ก่อนหน้า
            </Button>
            {Array.from({ length: totalPages }).slice(0, 10).map((_, i) => (
              <Button
                key={i}
                size="sm"
                variant={page === i + 1 ? 'solid' : 'ghost'}
                colorScheme={page === i + 1 ? 'blue' : undefined}
                onClick={() => goto(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              size="sm"
              onClick={() => goto(page + 1)}
              isDisabled={page === totalPages || users.length === 0}
            >
              ถัดไป
            </Button>
          </HStack>
        </TableContainer>
      </Box>
    </Stack>
  );
}
