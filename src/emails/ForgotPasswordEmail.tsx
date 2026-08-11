import {
  Button,
  Html,
  Text,
  Section,
  Container,
  Heading,
  Hr,
  Link,
  Tailwind,
  Body,
} from 'react-email';

export const ForgotPasswordEmail = ({
  name,
  resetLink,
  otp,
}: {
  name: string;
  resetLink: string;
  otp: number;
}) => (
  <Html>
    <Tailwind>
      <Body className="bg-white font-sans text-gray-800">
        <Container className="bg-white border border-gray-200 rounded-xl p-10 max-w-xl mx-auto my-10 shadow-sm">
          <Heading className="text-2xl text-gray-800 text-center font-bold mb-6">
            Reset Your Password
          </Heading>
          <Text className="text-base text-gray-600 leading-relaxed">
            Hi {name},
          </Text>
          <Text className="text-base text-gray-600 leading-relaxed mb-6">
            We received a request to reset your password. You can use the code
            below or click the button to proceed.
          </Text>

          {/* OTP Section */}
          <Section className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center my-6">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Verification Code
            </Text>
            <Text className="text-4xl font-extrabold text-indigo-600 tracking-[0.2em] my-0">
              {otp}
            </Text>
          </Section>

          {/* Reset Link Button */}
          <Section className="text-center my-8">
            <Button
              href={resetLink}
              className="bg-black text-white px-8 py-3 rounded-md text-sm font-semibold no-underline"
            >
              Reset Password
            </Button>
          </Section>

          <Text className="text-sm text-gray-500 text-center mt-6">
            If the button doesn't work, copy and paste this link: <br />
            <Link
              href={resetLink}
              className="text-indigo-600 underline break-all mt-2 inline-block"
            >
              {resetLink}
            </Link>
          </Text>

          <Hr className="border-gray-200 my-8" />
          <Text className="text-xs text-gray-400 text-center">
            For your security, this code and link will expire in 15 minutes. If
            you did not request this, please ignore this email or contact
            support.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
