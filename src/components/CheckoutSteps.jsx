import { Box, HStack, Text } from '@chakra-ui/react';

export default function CheckoutSteps({ current = 1 }) {
  const Step = ({ n, label }) => {
    const active = current === n;
    const done = current > n;
    const activeColor = n === 3 && active ? 'green.500' : 'blue.500';
    return (
      <HStack spacing={2}>
        <Box
          minW="28px"
          textAlign="center"
          bg={active ? activeColor : done ? 'green.500' : 'gray.200'}
          color={active || done ? 'white' : 'gray.700'}
          px={3}
          py={1}
          borderRadius="full"
          fontSize="sm"
          fontWeight="bold"
        >
          {n}
        </Box>
        <Text fontWeight={active ? 'bold' : 'normal'} color={active ? 'gray.900' : 'gray.600'}>{label}</Text>
      </HStack>
    );
  };

  return (
    <HStack spacing={4} align="center">
      <Step n={1} label="ตะกร้า" />
      <Box h={0.5} flex={1} bg={current > 1 ? 'green.300' : 'gray.200'} />
      <Step n={2} label="ชำระเงิน" />
      <Box h={0.5} flex={1} bg={current > 2 ? 'green.300' : 'gray.200'} />
      <Step n={3} label="เสร็จสิ้น" />
    </HStack>
  );
}
