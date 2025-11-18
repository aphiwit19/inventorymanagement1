import { AspectRatio, Box, Button, Divider, Heading, HStack, Icon, IconButton, Image, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Text, Tooltip } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { getProductById } from '../../services/products';
import { X } from 'lucide-react';
import CheckoutSteps from '../../components/CheckoutSteps';

export default function Cart() {
  const items = useCartStore((s)=> s.items);
  const setQty = useCartStore((s)=> s.setQty);
  const remove = useCartStore((s)=> s.remove);
  const clear = useCartStore((s)=> s.clear);
  const total = useCartStore((s)=> s.total());

  const rows = items.map((i)=> ({ ...i, product: getProductById(i.productId) })).filter(r => !!r.product);
  const imgOf = (p) => (p.images && p.images[0]) || `https://picsum.photos/seed/${p.id}/600/400`;

  if (rows.length === 0) {
    return (
      <Stack spacing={6} align="center">
        <Heading size="lg">ตะกร้าของคุณว่างเปล่า</Heading>
        <Text color="gray.600">เริ่มช้อปเลย สินค้าพร้อมส่งและราคาดี</Text>
        <Button as={RouterLink} to="/products" colorScheme="blue">ไปหน้าเลือกสินค้า</Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={6}>
      <CheckoutSteps current={1} />
      <Heading size="lg">ตะกร้าสินค้า</Heading>
      <Stack direction={{ base:'column', lg:'row' }} spacing={6} align="start">
        {/* Left: items */}
        <Box flex="1" bg="white" borderRadius="xl" boxShadow="sm" p={4} w="full">
          <TableContainer>
            <Table size="md">
              <Thead bg="gray.50">
                <Tr>
                  <Th>สินค้า</Th>
                  <Th isNumeric>ราคา</Th>
                  <Th isNumeric>จำนวน</Th>
                  <Th isNumeric>รวม</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {rows.map(({ product, qty })=> (
                  <Tr key={product.id} _hover={{ bg: 'gray.50' }}>
                    <Td>
                      <HStack align="center" spacing={4}>
                        <AspectRatio ratio={1} w="60px">
                          <Image src={imgOf(product)} alt={product.name} objectFit="cover" borderRadius="md" bg="gray.50" />
                        </AspectRatio>
                        <Stack spacing={0}>
                          <Text fontWeight="medium">{product.name}</Text>
                          <Text fontSize="sm" color="gray.500">SKU: {product.sku}</Text>
                        </Stack>
                      </HStack>
                    </Td>
                    <Td isNumeric>฿{product.price.toLocaleString()}</Td>
                    <Td isNumeric>
                      <NumberInput size="sm" value={qty} min={1} max={product.stock} onChange={(v)=> setQty(product.id, Number(v) || 1)} w="24">
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </Td>
                    <Td isNumeric>฿{(product.price * qty).toLocaleString()}</Td>
                    <Td isNumeric>
                      <IconButton aria-label="remove" size="sm" icon={<X size={16} />} variant="ghost" onClick={()=> remove(product.id)} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          <HStack justify="space-between" mt={4}>
            <Button variant="ghost" onClick={clear}>ล้างตะกร้า</Button>
            <Button as={RouterLink} to="/products" variant="outline">เลือกสินค้าเพิ่ม</Button>
          </HStack>
        </Box>

        {/* Right: summary */}
        <Box w={{ base:'full', lg:'360px' }} bg="white" borderRadius="2xl" boxShadow="md" p={0} overflow="hidden" position="sticky" top={4}>
          <Box bgGradient="linear(to-r, blue.500, purple.500)" color="white" p={5}>
            <Heading size="md">สรุปคำสั่งซื้อ</Heading>
            <Text mt={1} color="whiteAlpha.900" fontSize="sm">ตรวจสอบยอดก่อนดำเนินการ</Text>
          </Box>
          <Box p={6}>
            <Stack spacing={3} fontSize="sm">
              <HStack justify="space-between"><Text color="gray.600">ยอดรวมสินค้า</Text><Text>฿{total.toLocaleString()}</Text></HStack>
              <HStack justify="space-between"><Text color="gray.600">ค่าจัดส่ง</Text><Text>คำนวณตอนชำระเงิน</Text></HStack>
            </Stack>
            <Divider my={4} />
            <HStack justify="space-between" mb={4}>
              <Text fontWeight="bold">ยอดชำระ</Text>
              <Text fontWeight="bold" fontSize="xl">฿{total.toLocaleString()}</Text>
            </HStack>
            <Button
              colorScheme="blue"
              size="md"
              w="full"
              as={RouterLink}
              to="/checkout"
            >
              ไปชำระเงิน
            </Button>
          </Box>
        </Box>
      </Stack>
    </Stack>
  );
}
