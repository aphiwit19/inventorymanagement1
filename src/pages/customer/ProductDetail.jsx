import { useParams, Link as RouterLink } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { AspectRatio, Box, Button, Heading, HStack, Image, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, SimpleGrid, Stack, Tag, Text } from '@chakra-ui/react';
import { getProductById, listProducts } from '../../services/products';
import { useCartStore } from '../../store/cartStore';

export default function ProductDetail() {
  const { id } = useParams();
  const product = getProductById(id);
  const add = useCartStore((s)=> s.add);
  const [qty, setQty] = useState(1);

  const related = useMemo(()=> listProducts().filter(p => p.id !== id).slice(0,3), [id]);

  if (!product) {
    return (
      <Box>ไม่พบสินค้า</Box>
    );
  }

  const imgOf = (p) => (p.images && p.images[0]) || `https://picsum.photos/seed/${p.id}/900/700`;

  return (
    <Stack spacing={8}>
      <HStack align={{ base:'stretch', md:'start' }} spacing={8} flexDir={{ base:'column', md:'row' }}>
        <Box flex="1" bg="white" borderRadius="xl" boxShadow="sm" p={5}>
          <AspectRatio ratio={4/3} borderRadius="lg" overflow="hidden">
            <Image src={imgOf(product)} alt={product.name} objectFit="cover" bg="gray.50" />
          </AspectRatio>
        </Box>
        <Box flex="1.2" bg="white" borderRadius="xl" boxShadow="sm" p={6}>
          <HStack justify="space-between" mb={2}>
            <Tag colorScheme={product.stock <= product.reorderLevel ? 'red' : 'green'}>{product.stock <= product.reorderLevel ? 'สต็อกต่ำ' : 'พร้อมส่ง'}</Tag>
            <Text fontSize="2xl" fontWeight="bold">฿{product.price.toLocaleString()}</Text>
          </HStack>
          <Heading size="lg" mb={2}>{product.name}</Heading>
          <Text color="gray.600" mb={6}>{product.description}</Text>
          <HStack spacing={4}>
            <NumberInput value={qty} min={1} max={product.stock} onChange={(v)=> setQty(Number(v) || 1)} w="28">
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Button colorScheme="blue" onClick={()=> add(product.id, qty)}>เพิ่มลงตะกร้า</Button>
          </HStack>
        </Box>
      </HStack>

      <Box>
        <Heading size="md" mb={4}>สินค้าที่เกี่ยวข้อง</Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
          {related.map(p => (
            <Box key={p.id} bg="white" borderRadius="lg" boxShadow="sm" p={4} _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }} transition="all .2s">
              <AspectRatio ratio={4/3} mb={3}>
                <Image src={imgOf(p)} alt={p.name} objectFit="cover" borderRadius="md" bg="gray.50" />
              </AspectRatio>
              <Heading size="sm" mb={1}>{p.name}</Heading>
              <Text color="gray.600" mb={3} noOfLines={2}>{p.description}</Text>
              <HStack justify="space-between" align="center">
                <Text fontWeight="bold">฿{p.price.toLocaleString()}</Text>
                <HStack>
                  <Button as={RouterLink} to={`/product/${p.id}`} size="xs" variant="outline">ดู</Button>
                  <Button size="xs" colorScheme="blue" onClick={()=> add(p.id, 1)}>เพิ่ม</Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </Stack>
  );
}
