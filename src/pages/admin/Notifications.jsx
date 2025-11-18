import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Heading, HStack, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Tag, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/notifications';

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const notis = useMemo(()=> listNotifications(), [tick]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const onRead = (n) => { markNotificationRead(n.id); setTick(t=> t+1); };
  const onReadAll = () => { markAllNotificationsRead(); setTick(t=> t+1); };

  const colorOf = (t)=> t==='new_order'? 'blue' : t==='low_stock' ? 'red' : 'gray';

  const totalPages = Math.max(1, Math.ceil(notis.length / pageSize));
  const paged = notis.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goto = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [tick]);

  const onOpen = (n) => {
    markNotificationRead(n.id);
    setTick(t=> t+1);
    if (n.entity === 'product' && n.entityId) {
      navigate(`/admin/products?q=${encodeURIComponent(n.entityId)}`);
    } else if (n.entity === 'requisition' && n.entityId) {
      navigate(`/admin/requisitions/${encodeURIComponent(n.entityId)}`);
    }
  };

  return (
    <Stack spacing={6}>
      <HStack justify="space-between">
        <Heading size="lg">การแจ้งเตือน</Heading>
        <Button onClick={onReadAll} variant="outline">ทำเครื่องหมายว่าอ่านทั้งหมด</Button>
      </HStack>
      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        <TableContainer>
          <Table size="md">
            <Thead>
              <Tr>
                <Th>ประเภท</Th>
                <Th>หัวข้อ</Th>
                <Th>ข้อความ</Th>
                <Th>เวลา</Th>
                <Th>สถานะ</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paged.map(n => (
                <Tr
                  key={n.id}
                  _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                  onClick={() => onOpen(n)}
                >
                  <Td>
                    <Tag colorScheme={colorOf(n.type)}>{n.type}</Tag>
                  </Td>
                  <Td maxW="260px">
                    <Text noOfLines={1} wordBreak="break-word">
                      {n.title}
                    </Text>
                  </Td>
                  <Td maxW="420px">
                    <Text noOfLines={2} wordBreak="break-word" whiteSpace="normal">
                      {n.message}
                    </Text>
                  </Td>
                  <Td whiteSpace="nowrap">{new Date(n.createdAt).toLocaleString()}</Td>
                  <Td>
                    {!n.read ? (
                      <Button
                        size="sm"
                        onClick={() => onRead(n)}
                        colorScheme="blue"
                        variant="ghost"
                      >
                        ทำเป็นอ่านแล้ว
                      </Button>
                    ) : (
                      <Text color="gray.500">อ่านแล้ว</Text>
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
              isDisabled={currentPage === 1 || notis.length === 0}
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
              isDisabled={currentPage === totalPages || notis.length === 0}
            >
              ถัดไป
            </Button>
          </HStack>
        </TableContainer>
      </Box>
    </Stack>
  );
}
