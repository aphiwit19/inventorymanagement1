import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react';
import CheckoutSteps from '../../components/CheckoutSteps';

export default function OrderSuccess() {
  const { id } = useParams();
  return (
    <Stack spacing={6} align="center">
      <CheckoutSteps current={3} />
      <Heading size="lg">สั่งซื้อสำเร็จ</Heading>
      <Text color="gray.600">เลขคำสั่งซื้อของคุณคือ {id}</Text>
      <Box>
        <Button as={RouterLink} to="/orders" colorScheme="blue" mr={3}>ดูคำสั่งซื้อของฉัน</Button>
        <Button as={RouterLink} to="/products" variant="outline">เลือกสินค้าเพิ่ม</Button>
      </Box>
    </Stack>
  );
}
