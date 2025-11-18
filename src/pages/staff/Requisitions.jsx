import { useMemo, useState } from 'react';
import { Box, Button, Heading, HStack, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Tag, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { getCurrentUser } from '../../services/auth';
import { listRequisitionsByRequester } from '../../services/requisitions';

export default function StaffRequisitions() {
  const user = getCurrentUser();
  const [tick] = useState(0);
  const data = useMemo(()=> listRequisitionsByRequester(user?.id||''), [user?.id, tick]);
  const tStatus = (s)=> s==='pending'?'รอดำเนินการ': s==='in_progress'? 'กำลังดำเนินการส่ง':'สำเร็จ';

  return (
    <Stack spacing={6}>
      <HStack justify="space-between">
        <Heading size="lg">การเบิกสินค้าของฉัน</Heading>
      </HStack>
      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        <TableContainer>
          <Table size="md">
            <Thead>
              <Tr>
                <Th>เลขที่</Th>
                <Th>ผู้รับ</Th>
                <Th>วิธีรับ</Th>
                <Th isNumeric>ราคารวม</Th>
                <Th>สถานะ</Th>
                <Th>อัปเดตล่าสุด</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.length === 0 && (
                <Tr><Td colSpan={6}><Box py={8} textAlign="center" color="gray.500">ยังไม่มีรายการเบิก</Box></Td></Tr>
              )}
              {data.map(r => (
                <Tr key={r.id}>
                  <Td>{r.id}</Td>
                  <Td>{r.recipientName}</Td>
                  <Td>{r.receiveMethod==='pickup'?'รับเอง':'จัดส่ง'}</Td>
                  <Td isNumeric>฿{Number(r.total||0).toLocaleString()}</Td>
                  <Td><Tag colorScheme={r.status==='pending'?'yellow': r.status==='in_progress'?'blue':'green'}>{tStatus(r.status)}</Tag></Td>
                  <Td>{new Date(r.updatedAt||r.createdAt).toLocaleString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Stack>
  );
}
