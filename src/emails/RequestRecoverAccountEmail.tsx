import {
  Button,
  Html,
  Text,
  Section,
  Container,
  Heading,
  Hr,
  Tailwind,
  Body,
  Link,
} from 'react-email';

export const RequestRecoverAccountEmail = ({
  name,
  accountRecoverLink,
  otp,
}: {
  name: string;
  accountRecoverLink: string;
  otp: number;
}) => (
  <Html>
    <Tailwind>
      <Body className="bg-white font-sans text-gray-800">
        <Container className="bg-white border border-gray-200 rounded-xl p-10 max-w-xl mx-auto my-10 shadow-sm">
          <Heading className="text-2xl text-gray-800 text-center font-bold mb-6">
            Account Recovery Request
          </Heading>
          <Text className="text-base text-gray-600 leading-relaxed">
            Hello {name},
          </Text>
          <Text className="text-base text-gray-600 leading-relaxed mb-6">
            We received a request to recover your account. Please use the
            verification code below or click the button to reset your password
            and recover your account.
          </Text>

          <Section className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center my-6">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Your Verification Code
            </Text>
            <Text className="text-4xl font-extrabold text-indigo-600 tracking-[0.2em] my-0">
              {otp}
            </Text>
          </Section>

          <Section className="text-center my-8">
            <Button
              href={accountRecoverLink}
              className="bg-indigo-600 text-white px-8 py-3 rounded-md text-sm font-semibold no-underline"
            >
              Recover Account
            </Button>
          </Section>

          <Text className="text-sm text-gray-500 text-center mt-6">
            If the button doesn't work, copy and paste this link: <br />
            <Link
              href={accountRecoverLink}
              className="text-indigo-600 underline break-all mt-2 inline-block"
            >
              {accountRecoverLink}
            </Link>
          </Text>

          <Hr className="border-gray-200 my-8" />
          <Text className="text-xs text-gray-400 text-center">
            If you didn't request this email, please ignore it. Your account is
            safe.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
