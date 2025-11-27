import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Heading, HStack, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Tag, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationReadApi, markAllNotificationsReadApi } from '../../services/notifications';

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [notis, setNotis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch notifications from API
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const notifications = await getNotifications();
        if (active) {
          setNotis(notifications);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        if (active) {
          setNotis([]);
          setLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, [tick]);

  const onRead = async (n) => { 
  console.log('Marking notification as read:', n.id);
  try {
    await markNotificationReadApi(n.id); 
    console.log('Successfully marked as read via API');
    setTick(t=> t+1);
  } catch (error) {
    console.error('Failed to mark notification as read via API, trying fallback:', error);
    // Fallback to local storage method
    try {
      const { markNotificationRead } = await import('../../services/notifications');
      markNotificationRead(n.id);
      console.log('Successfully marked as read via fallback');
      setTick(t=> t+1);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
  }
};
  
  const onReadAll = async () => { 
  console.log('Marking all notifications as read');
  try {
    await markAllNotificationsReadApi(); 
    console.log('Successfully marked all as read via API');
    setTick(t=> t+1);
  } catch (error) {
    console.error('Failed to mark all notifications as read via API, trying fallback:', error);
    // Fallback to local storage method
    try {
      const { markAllNotificationsRead } = await import('../../services/notifications');
      markAllNotificationsRead();
      console.log('Successfully marked all as read via fallback');
      setTick(t=> t+1);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
  }
};

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

  const onOpen = async (n) => {
  // Mark as read using API
  try {
    await markNotificationReadApi(n.id); 
    console.log('Notifications: Marked as read successfully');
    setTick(t=> t+1);
  } catch (error) {
    console.error('Notifications: Failed to mark as read:', error);
  }
};

  return (
    <Stack spacing={6}>
      <HStack justify="space-between">
        <Heading size="lg">การแจ้งเตือน</Heading>
      </HStack>
      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        {loading ? (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">กำลังโหลดการแจ้งเตือน...</Text>
          </Box>
        ) : notis.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">ไม่มีการแจ้งเตือน</Text>
          </Box>
        ) : (
          <TableContainer>
            <Table size="md">
              <Thead>
                <Tr>
                  <Th>หัวข้อ</Th>
                  <Th>ข้อความ</Th>
                  <Th>เวลา</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paged.map(n => (
                <Tr
                  key={n.id}
                  _hover={{ bg: 'gray.50' }}
                  transition="background-color 0.2s"
                >
                  <Td maxW="260px">
                    <Text noOfLines={1} wordBreak="break-word" fontWeight="medium">
                      {n.title}
                    </Text>
                  </Td>
                  <Td maxW="420px">
                    <Text noOfLines={2} wordBreak="break-word" whiteSpace="normal">
                      {n.message}
                    </Text>
                  </Td>
                  <Td whiteSpace="nowrap">{new Date(n.createdAt).toLocaleString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        )}
        {!loading && notis.length > 0 && (
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
        )}
      </Box>
    </Stack>
  );
}
